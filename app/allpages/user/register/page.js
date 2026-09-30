"use client"

import React, { useState } from 'react';
import { db } from "../../../../config";
import { ref, push } from 'firebase/database';
import { createUserWithEmailAndPassword, sendEmailVerification, getAuth } from 'firebase/auth';
import { FaBuilding, FaUser } from "react-icons/fa";
import { MdEmail } from "react-icons/md"
import { GiPadlock, GiDialPadlock } from "react-icons/gi";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { FaPhoneAlt } from "react-icons/fa";
import { useRouter } from 'next/navigation';
import { useUserAccountName, useUserEmail, useUserID, useUserName, useUserPhone, useUserRole } from '../../../componets/zustand/profile';
import Link from 'next/link';
import { useUserTheme } from '@/app/componets/zustand/theme';

const Register = () => {
  const auth = getAuth();
  const router = useRouter();

  const [adminName, setAdminName] = useState('');
  const [adminRealName, setAdminRealName] = useState('');
  const [adminPhone, setAdminPhone] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [confirmpass, setConfirmpass] = useState('');
  const [errorMessage, setErrorMessage] = useState("");

  const theme = useUserTheme((state) => state.userTheme);

  const [showPassword, setShowPassword] = useState(false);

  const registerUser = async () => {
    if (!adminName || !adminRealName || !adminPhone || !adminEmail || !adminPassword || !confirmpass) {
      setErrorMessage("All fields are required!");
      return;
    }
    if (adminPassword.length < 6) {
      setErrorMessage("Password must be at least 6 characters!");
      return;
    }
    if (adminPassword !== confirmpass) {
      setErrorMessage("Passwords do not match!");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, adminEmail, adminPassword);
      const user = userCredential.user;

      try {
        await sendEmailVerification(user, {
          handleCodeInApp: true,
          url: "https://chisendposproduction0011.firebaseapp.com",
        });
      } catch (err) {
        console.log("Verification email error:", err);
      }

      const dbRef = ref(db, `web/pos/`);
      const newAdminRef = await push(dbRef, {
        Name: adminName,
        Phone: adminPhone,
        Email: adminEmail,
      });

      const userAccountId = newAdminRef.key;

      useUserID.setState({ userID: userAccountId });
      useUserEmail.setState({ userEmail: adminEmail });
      useUserPhone.setState({ userPhone: adminPhone });
      useUserName.setState({ userName: adminName });
      useUserAccountName.setState({ userAccountName: adminRealName });
      useUserRole.setState({ userRole: 'Admin' });

      const newbranchRef1 = push(ref(db, `user/accounts/`), {
        Email: adminEmail,
        Id: userAccountId,
        Phone: adminPhone,
        Name: adminName,
        UserName: adminRealName,
        Password: adminPassword,
        Role: "Admin",
        CreatedAt: Date.now(),
      });

      const newCreditKey1 = newbranchRef1.key;
      const dbRef2 = ref(db, `web/pos/${userAccountId}/employees`);
      const newbranchRef = push(dbRef2, {

        Name: adminRealName,
        Phone: adminPhone,
        Email: adminEmail,
        AccountId: newCreditKey1,
        Role: "Admin",
        CreatedAt: Date.now(),

      });

      setErrorMessage("");
      router.push('/');

      setAdminName('');
      setAdminRealName('');
      setAdminPhone('');
      setAdminEmail('');
      setAdminPassword('');
      setConfirmpass('');

    } catch (error) {
      console.log("Registration error:", error.message);
      if (error.message.includes("email-already")) {
        setErrorMessage("Email already exists!");
      } else {
        setErrorMessage("Registration failed. Try again.");
      }
    }
  };

  return (
    <div className={`flex items-center justify-center min-h-screen p-4
      ${theme === "Dark" ? "bg-gradient-to-b from-[#0f1026] to-[#171941]" : "bg-gray-100"}`}>

      <div className={`relative shadow-2xl rounded-3xl p-10 max-w-md w-full 
        ${theme === "Dark"
          ? "bg-gradient-to-b from-[#132962] to-[#0f1026]"
          : "bg-white"}`}>

        {/* Logo */}
        <div className="flex justify-center mb-6">
          <img src="/logo.png" alt="Logo" className="h-14 w-auto shadow-lg rounded-xl" />
        </div>

        {/* Title */}
        <div className="flex justify-center mb-4">
          <h1 className={`text-xl font-extrabold 
            ${theme === "Dark" ? "text-white" : "text-blue-700"}`}>Chisend POS</h1>
        </div>

        <h2 className={`text-lg font-semibold mb-6 text-center
          ${theme === "Dark" ? "text-gray-200" : "text-blue-600"}`}>
          Create Business Account
        </h2>

        {/* Error */}
        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-red-100 text-red-700 border border-red-400 shadow-sm">
            {errorMessage}
          </div>
        )}

        <div className="space-y-4">
          {/* Name */}
          <div className="relative">
            <input
              type="text"
              placeholder="Company Name"
              className="w-full p-3 text-sm pl-14 rounded-xl shadow-inner focus:outline-none focus:ring-2   transition duration-300 border-2  border-black"
              style={{ color: "#000000" }}
              value={adminName}
              onChange={(e) => setAdminName(e.target.value)}
            />
            <FaBuilding className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-xl 
              ${theme === "Dark" ? "text-white/80" : "text-blue-600"}`} />
          </div>
          {/* Phone */}
          <div className="relative">
            <input
              type="text"
              placeholder="Business Phone Number"
              className="w-full p-3 text-sm pl-14 rounded-xl shadow-inner focus:outline-none focus:ring-2   transition duration-300 border-2  border-black"
              style={{ color: "#000000" }}
              value={adminPhone}
              onChange={(e) => setAdminPhone(e.target.value)}
            />
            <FaPhoneAlt className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-xl
              ${theme === "Dark" ? "text-white/80" : "text-blue-600"}`} />
          </div>

          {/* Email */}
          <div className="relative">
            <input
              type="email"
              placeholder="Enter Email"
              className="w-full p-3 text-sm pl-14 rounded-xl shadow-inner focus:outline-none focus:ring-2   transition duration-300 border-2  border-black"
              style={{ color: "#000000" }}
              value={adminEmail}
              onChange={(e) => setAdminEmail(e.target.value)}
            />
            <MdEmail className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-xl
              ${theme === "Dark" ? "text-white/80" : "text-blue-600"}`} />
          </div>

          {/* Name */}
          <div className="relative">
            <input
              type="text"
              placeholder="Enter Business Owner Name"
              className="w-full p-3 text-sm pl-14 rounded-xl shadow-inner focus:outline-none focus:ring-2   transition duration-300 border-2  border-black"
              style={{ color: "#000000" }}
              value={adminRealName}
              onChange={(e) => setAdminRealName(e.target.value)}
            />
            <FaUser className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-xl 
              ${theme === "Dark" ? "text-white/80" : "text-blue-600"}`} />
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Password ... 6+ characters"
              className="w-full p-3 pl-14 pr-12 rounded-xl shadow-inner focus:outline-none focus:ring-2 text-sm transition duration-300 border-2 border-black"
              style={{ color: "#000000" }}
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
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

          {/* Confirm Password */}
          <div className="relative">  
            <input
              type="password"
              placeholder="Confirm Password"
              className="w-full p-3 text-sm pl-14 rounded-xl shadow-inner focus:outline-none focus:ring-2   transition duration-300 border-2  border-black"
              style={{ color: "#000000" }}
              value={confirmpass}
              onChange={(e) => setConfirmpass(e.target.value)}
            />
            <GiDialPadlock className={`absolute left-4 top-1/2 transform -translate-y-1/2 text-xl
              ${theme === "Dark" ? "text-white/80" : "text-blue-600"}`} />
          </div>

          {/* Register Button */}
          <div className="flex justify-center">
            <button
              onClick={registerUser}
              className={`w-1/2 p-2 text-sm font-semibold rounded-full text-white shadow-lg hover:shadow-xl transition-all duration-300
                ${theme === "Dark" ? "bg-gradient-to-r from-blue-700 to-blue-500 hover:from-blue-500 hover:to-blue-700"
                  : "bg-gradient-to-r from-blue-600 to-blue-400 hover:from-blue-400 hover:to-blue-600"}`}>
              Register Business
            </button>
          </div>
        </div>

        {/* Login Link */}
        <p className={`mt-6 text-center text-sm 
          ${theme === "Dark" ? "text-gray-300" : "text-gray-600"}`}>
          Already have an account?{" "}
          <Link href="/allpages/user/login" className="text-blue-500 hover:underline font-medium">
            Log In
          </Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
