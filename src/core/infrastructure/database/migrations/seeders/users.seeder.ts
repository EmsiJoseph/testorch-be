// import {hash} from "@node-rs/argon2";
// import {AuthenticationService} from "../../../core/infrastructure/services/auth/authentication.service";
// import {UsersRepository} from "../../../core/infrastructure/repositories/users/users.repository";
// import {NewUserDto} from "../../../core/domain/models/user";
//
//
// async function main() {
//     const usersRepository = new UsersRepository();
//     const authenticationService = new AuthenticationService(usersRepository);
//
//     const passwordHash = await hash("admin12345678", {
//         memoryCost: 19456,
//         timeCost: 2,
//         outputLen: 32,
//         parallelism: 1,
//     });
//
//     const userId = authenticationService.generateUserId();
//
//     const newUser: NewUserDto = {
//         id: userId,
//         first_name: 'admin',
//         last_name: 'admin',
//         email: 'admin@email.com',
//         password_hash: passwordHash
//     }
//     const res = await usersRepository.createUser(newUser);
//     console.log("Insert user: ", res)
//     process.exit();
// }
//
// main();