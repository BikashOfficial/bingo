// Native browser-based E2EE using Web Crypto API (RSA-OAEP + AES-GCM)

let cachedKeys = null;

// Helper: Convert ArrayBuffer to Base64 String
export function arrayBufferToBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// Helper: Convert Base64 String to ArrayBuffer
export function base64ToArrayBuffer(base64) {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Generate or retrieve the user's RSA-OAEP key pair
export async function getOrCreateKeyPair() {
  if (cachedKeys) {
    return cachedKeys;
  }

  try {
    const storedPub = sessionStorage.getItem("chat_pub_jwk");
    const storedPriv = sessionStorage.getItem("chat_priv_jwk");

    if (storedPub && storedPriv) {
      const pubJwk = JSON.parse(storedPub);
      const privJwk = JSON.parse(storedPriv);

      const publicKey = await window.crypto.subtle.importKey(
        "jwk",
        pubJwk,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"],
      );

      const privateKey = await window.crypto.subtle.importKey(
        "jwk",
        privJwk,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["decrypt"],
      );

      cachedKeys = { publicKey, privateKey, publicJwk: pubJwk };
      return cachedKeys;
    }
  } catch (err) {
    console.warn(
      "Failed to load keys from sessionStorage, generating new ones...",
      err,
    );
  }

  // Generate new RSA-OAEP key pair
  const keyPair = await window.crypto.subtle.generateKey(
    {
      name: "RSA-OAEP",
      modulusLength: 2048,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: "SHA-256",
    },
    true,
    ["encrypt", "decrypt"],
  );

  const pubJwk = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
  const privJwk = await window.crypto.subtle.exportKey(
    "jwk",
    keyPair.privateKey,
  );

  try {
    sessionStorage.setItem("chat_pub_jwk", JSON.stringify(pubJwk));
    sessionStorage.setItem("chat_priv_jwk", JSON.stringify(privJwk));
  } catch (err) {
    console.warn("Failed to save keys to sessionStorage:", err);
  }

  cachedKeys = {
    publicKey: keyPair.publicKey,
    privateKey: keyPair.privateKey,
    publicJwk: pubJwk,
  };

  return cachedKeys;
}

// Encrypt payload for all active members in the room
export async function encryptMessage(payload, members) {
  // 1. Generate ephemeral symmetric AES-GCM 256 key
  const aesKey = await window.crypto.subtle.generateKey(
    { name: "AES-GCM", length: 256 },
    true,
    ["encrypt", "decrypt"],
  );

  const aesJwk = await window.crypto.subtle.exportKey("jwk", aesKey);
  const aesJwkString = JSON.stringify(aesJwk);

  // 2. Encrypt the payload JSON string with the AES key
  const encoder = new TextEncoder();
  const payloadData = encoder.encode(JSON.stringify(payload));
  const iv = window.crypto.getRandomValues(new Uint8Array(12));

  const ciphertextBuffer = await window.crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv },
    aesKey,
    payloadData,
  );

  const ciphertextB64 = arrayBufferToBase64(ciphertextBuffer);
  const ivB64 = arrayBufferToBase64(iv);

  // 3. Encrypt the AES key's JWK for each member using their public key
  const encryptedKeys = {};
  const textEncoder = new TextEncoder();
  const aesJwkData = textEncoder.encode(aesJwkString);

  for (const member of members) {
    if (!member.publicKey || !member.displayName) continue;
    try {
      // Import member's public key (RSA-OAEP)
      const pubKey = await window.crypto.subtle.importKey(
        "jwk",
        member.publicKey,
        { name: "RSA-OAEP", hash: "SHA-256" },
        true,
        ["encrypt"],
      );

      const encryptedKeyBuf = await window.crypto.subtle.encrypt(
        { name: "RSA-OAEP" },
        pubKey,
        aesJwkData,
      );

      encryptedKeys[member.displayName] = arrayBufferToBase64(encryptedKeyBuf);
    } catch (err) {
      console.warn(
        `Failed to encrypt key for member ${member.displayName}:`,
        err,
      );
    }
  }

  return {
    ciphertext: ciphertextB64,
    iv: ivB64,
    encryptedKeys,
  };
}

// Decrypt message using the private key (returns decrypted payload + raw key)
export async function decryptMessage(message, privateKey, myDisplayName) {
  const { ciphertext, iv, encryptedKeys } = message;

  if (!ciphertext || !iv || !encryptedKeys) {
    throw new Error("Message is not in encrypted format");
  }

  const encryptedKeyB64 = encryptedKeys[myDisplayName];
  if (!encryptedKeyB64) {
    throw new Error("Message not encrypted for this user");
  }

  // 1. Decrypt the AES key's JWK using the private key (RSA-OAEP)
  const encryptedKeyBuf = base64ToArrayBuffer(encryptedKeyB64);
  const decryptedKeyBuf = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedKeyBuf,
  );

  const textDecoder = new TextDecoder();
  const aesJwkString = textDecoder.decode(decryptedKeyBuf);
  const aesJwk = JSON.parse(aesJwkString);

  // 2. Import the AES-GCM key
  const aesKey = await window.crypto.subtle.importKey(
    "jwk",
    aesJwk,
    { name: "AES-GCM" },
    true,
    ["decrypt"],
  );

  // 3. Decrypt the ciphertext using the AES key
  const ciphertextBuf = base64ToArrayBuffer(ciphertext);
  const ivBuf = base64ToArrayBuffer(iv);

  const decryptedPayloadBuf = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuf },
    aesKey,
    ciphertextBuf,
  );

  const decryptedPayloadString = textDecoder.decode(decryptedPayloadBuf);
  return {
    payload: JSON.parse(decryptedPayloadString),
    aesJwk,
  };
}

// Encrypt a single AES key JWK string using a member's public key (RSA-OAEP)
export async function encryptKeyForMember(aesJwk, memberPublicKeyJwk) {
  const pubKey = await window.crypto.subtle.importKey(
    "jwk",
    memberPublicKeyJwk,
    { name: "RSA-OAEP", hash: "SHA-256" },
    true,
    ["encrypt"]
  );

  const textEncoder = new TextEncoder();
  const aesJwkData = textEncoder.encode(JSON.stringify(aesJwk));

  const encryptedKeyBuf = await window.crypto.subtle.encrypt(
    { name: "RSA-OAEP" },
    pubKey,
    aesJwkData
  );

  return arrayBufferToBase64(encryptedKeyBuf);
}

// Decrypt a single message AES key using the user's private key
export async function decryptKeyWithPrivateKey(encryptedKeyB64, privateKey) {
  const encryptedKeyBuf = base64ToArrayBuffer(encryptedKeyB64);
  const decryptedKeyBuf = await window.crypto.subtle.decrypt(
    { name: "RSA-OAEP" },
    privateKey,
    encryptedKeyBuf
  );

  const textDecoder = new TextDecoder();
  const aesJwkString = textDecoder.decode(decryptedKeyBuf);
  return JSON.parse(aesJwkString);
}

// Decrypt a message payload using a raw AES key JWK
export async function decryptWithAesKey(ciphertext, iv, aesJwk) {
  const aesKey = await window.crypto.subtle.importKey(
    "jwk",
    aesJwk,
    { name: "AES-GCM" },
    true,
    ["decrypt"]
  );

  const ciphertextBuf = base64ToArrayBuffer(ciphertext);
  const ivBuf = base64ToArrayBuffer(iv);

  const decryptedPayloadBuf = await window.crypto.subtle.decrypt(
    { name: "AES-GCM", iv: ivBuf },
    aesKey,
    ciphertextBuf
  );

  const textDecoder = new TextDecoder();
  const decryptedPayloadString = textDecoder.decode(decryptedPayloadBuf);
  return JSON.parse(decryptedPayloadString);
}
