"use client"

import React, { useState } from 'react';
import { db } from "../../../../config";
import { signInWithEmailAndPassword, sendPasswordResetEmail, getAuth } from "firebase/auth";
import { ref, get } from 'firebase/database';
import { useUserAccountName, useUserEmail, useUserID, useUserName, useUserPhone, useUserRole } from '../../../componets/zustand/profile';
import { MdEmail } from "react-icons/md";
import { GiPadlock } from "react-icons/gi";
import { useUserTheme } from '@/app/componets/zustand/theme';
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import Link from 'next/link';

const LogIn = () => {
    const [name, setName] = useState('');
    const [password, setPassword] = useState('');
    const [forgotemail, setForgetemail] = useState("");
    const [isModalOpen, setModalOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");

    const theme = useUserTheme((state) => state.userTheme);
    const auth = getAuth();

    const handleForgotPassword = () => setModalOpen(true);
    const closeModal = () => setModalOpen(false);



    const changepassword = async () => {
        if (!forgotemail) return;
        try {
            await sendPasswordResetEmail(auth, forgotemail);
            setForgetemail("");
            setErrorMessage("Reset link sent!");
        } catch (error) {
            console.log("error on reset", error);
            setForgetemail("");
            setErrorMessage("Failed to send reset link!");
        }
    };


    const LoginUser = async () => {
        if (!name || !password) {
            setErrorMessage("Email and Password are required!");
            return;
        }

        try {
            const userCredential = await signInWithEmailAndPassword(auth, name, password);
            const user = userCredential.user;

            setErrorMessage("");
            setName('');
            setPassword('');

            await fetchRole(name);

        } catch (error) {
            console.log(error.message);
            setErrorMessage("Invalid email or password!");
            setName('');
            setPassword('');
        }
    };

    const fetchRole = async (email) => {
        const snapshot = await get(ref(db, `user/accounts/`));
        const data = snapshot.val();

        if (data) {
            let emailUser = null, id = null, accountUser = null, nameUser = null, phoneUser = null, roleUser = null;
            Object.entries(data).forEach(([key, value]) => {
                if (value.Email === email) {
                    emailUser = value.Email;
                    nameUser = value.Name;
                    phoneUser = value.Phone;
                    id = value.Id;
                    roleUser = value.Role;
                    accountUser = value.UserName
                }
            });
            useUserID.setState({ userID: id });
            useUserEmail.setState({ userEmail: emailUser });
            useUserPhone.setState({ userPhone: phoneUser });
            useUserName.setState({ userName: nameUser });
            useUserAccountName.setState({ userAccountName: accountUser });
            useUserRole.setState({ userRole: roleUser });

        }

    };


    const [showPassword, setShowPassword] = useState(false);

    return (
        <div className={`flex items-center justify-center min-h-screen p-4
            ${theme === "Dark" ? "bg-gradient-to-b from-[#0f1026] to-[#171941]" : "bg-gray-100"}`}>

            <div className={`relative shadow-2xl rounded-3xl p-10 max-w-md w-full
                ${theme === "Dark" ? "bg-gradient-to-b from-[#132962] to-[#0f1026]" : "bg-white"}`}>

                {/* Logo */}
                <div className="flex justify-center mb-6">
                    <img src="/logo.png" alt="Logo" className="h-14 w-auto shadow-lg rounded-xl" />
                </div>

                {/* App Title */}
                <div className="flex justify-center mb-4">
                    <h1 className={`text-xl font-extrabold ${theme === "Dark" ? "text-white" : "text-blue-700"}`}>
                        Chisend POS
                    </h1>
                </div>

                <h2 className={`text-lg font-semibold mb-6 text-center ${theme === "Dark" ? "text-gray-200" : "text-blue-600"}`}>
                    Log In
                </h2>

                {/* INLINE ERROR */}
                {errorMessage && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 border border-red-400 rounded-xl shadow-sm">
                        {errorMessage}
                    </div>
                )}

                <div className="space-y-4">

                    {/* Email Input */}
                    <div className="relative">
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full p-3 pl-14 rounded-xl shadow-inner focus:outline-none focus:ring-2 transition duration-300 border-2 border-black text-sm"
                            style={{ color: "#000000" }}
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />
                        <MdEmail className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-xl
                            ${theme === "Dark" ? "text-white/80" : "text-blue-600"}`} />
                    </div>

                    {/* Password Input */}
                    <div className="relative">
                        <input
                            type={showPassword ? "text" : "password"}
                            placeholder="Password"
                            className="w-full p-3 pl-14 pr-12 rounded-xl shadow-inner focus:outline-none focus:ring-2 text-sm transition duration-300 border-2 border-black"
                            style={{ color: "#000000" }}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />

                        {/* Left padlock icon */}
                        <GiPadlock
                            className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-xl ${theme === "Dark" ? "text-white/80" : "text-blue-600"
                                }`}
                        />

                        {/* Right eye icon */}
                        <div
                            className="absolute right-4 top-1/2 transform -translate-y-1/2 cursor-pointer text-xl"
                            onClick={() => setShowPassword(!showPassword)}
                        >
                            {showPassword ? (
                                <AiFillEyeInvisible
                                    className={theme === "Dark" ? "text-white/80" : "text-black"}
                                />
                            ) : (
                                <AiFillEye
                                    className={theme === "Dark" ? "text-white/80" : "text-black"}
                                />
                            )}
                        </div>
                    </div>


                    {/* Log In Button */}
                    <div className="flex justify-center">
                        <button
                            onClick={LoginUser}
                            className={`w-1/2 p-1 text-md font-semibold rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-300
                                ${theme === "Dark"
                                    ? "bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-500 hover:to-blue-700"
                                    : "bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-400 hover:to-blue-600"}`}>
                            Log In
                        </button>
                    </div>

                </div>

                {/* Links */}
                <p className={`mt-6 text-center text-sm ${theme === "Dark" ? "text-gray-300" : "text-gray-600"}`}>
                    Join us today.{" "}
                    <Link href="/allpages/user/register" className="text-blue-500 hover:underline font-medium">
                        Create Business account
                    </Link>
                </p>

                <div className="mt-3 text-center">
                    <button onClick={handleForgotPassword} className="text-blue-500 hover:underline font-medium text-sm">
                        Forgot Password?
                    </button>
                </div>
            </div>

            {/* Forgot Password Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
                    <div className="bg-white p-6 rounded-2xl shadow-2xl w-96">
                        <h2 className="text-2xl font-bold mb-4 text-gray-900">Reset Password</h2>
                        <p className="mb-4 text-gray-700">Enter your email to receive a reset link:</p>

                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full p-4 border border-gray-300 rounded-xl mb-4 focus:outline-none focus:ring-2  "
                            value={forgotemail}
                            style={{ color: "#000000" }}
                            onChange={(e) => setForgetemail(e.target.value)}
                        />

                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={closeModal}
                                className="bg-red-700 px-5 py-2 rounded-xl hover:bg-red-500 text-white"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={changepassword}
                                className="bg-blue-600 px-5 py-2 rounded-xl text-white hover:bg-blue-500"
                            >
                                Send Reset Link
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default LogIn;
