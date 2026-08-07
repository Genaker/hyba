/**
 * A demo customer account. `password` is plaintext — fine for the raw demo
 * provider, never acceptable once a real provider (hashed auth) replaces it.
 *
 * @example
 * { "id": 1, "email": "AmandaRCole@example.org", "firstName": "Amanda", "lastName": "Cole", "password": "demo123" }
 */
export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  password: string;                 // demo only
}
