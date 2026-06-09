/**
 * Generates a unique 6-character alphanumeric room code.
 * Uses uppercase letters and digits, excluding ambiguous chars (0, O, I, 1).
 */
const CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateRoomCode() {
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += CHARS[Math.floor(Math.random() * CHARS.length)];
  }
  return code;
}

module.exports = { generateRoomCode };
