// import { User } from "@auth0/auth0-spa-js";
// import { Injectable } from "@nestjs/common";
// import { hashSync } from "@node-rs/argon2";
// import { IUsersRepository } from "../../../application/interfaces/repositories/users.repository.interface";

// @Injectable()
// export class MockUsersRepository implements IUsersRepository {
//     private _users: User[];

//     constructor() {
//         const hashOptions = {
//             memoryCost: 19456,
//             timeCost: 2,
//             outputLen: 32,
//             parallelism: 1,
//         };

//         this._users = [
//             {
//                 id: "1",
//                 first_name: "John",
//                 last_name: "Doe",
//                 email: "john.doe@example.com",
//                 password_hash: hashSync("password123", hashOptions),
//             },
//             {
//                 id: "2",
//                 first_name: "Jane",
//                 last_name: "Smith",
//                 email: "jane.smith@example.com",
//                 password_hash: hashSync("password456", hashOptions),
//             },
//         ];
//     }

//     async getUser(id: string): Promise<UserSelectType | undefined> {
//         return this._users.find((u) => u.id === id);
//     }

//     async getUserByEmail(email: string): Promise<UserSelectType | undefined> {
//         return this._users.find((u) => u.email === email);
//     }

//     async createUser(input: UserSelectType): Promise<UserSelectType> {
//         const newUser: UserSelectType = {
//             ...input,
//         };
//         this._users.push(newUser);
//         return newUser;
//     }
// }