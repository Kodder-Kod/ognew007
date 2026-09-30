"use client";

import { useState } from "react";
import { db } from "../../../config";
import { sendPasswordResetEmail, getAuth } from "firebase/auth";
import { ref, update, push, remove } from 'firebase/database';
import { signOut } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { useUserAccountName, useUserEmail, useUserID, useUserName, useUserPhone, useUserRole } from "../../componets/zustand/profile";
import { useUserEmployee, useUserEmployeeTotal } from "@/app/componets/zustand/employees";
import { useUserTheme } from "@/app/componets/zustand/theme";
import { TbXboxX } from "react-icons/tb";
import { TiTick } from "react-icons/ti";
import { useUserItems, useUserItemsData, useUserItemsTotal } from "@/app/componets/zustand/items";
import { useUserCategories, useUserCategoriesTotal } from "@/app/componets/zustand/categories";
import { useUserSupplier, useUserSupplierTotal } from "@/app/componets/zustand/supplier";
import { useUserSupplyItems, useUserSupplyItemsData, useUserSupplyItemsTotal } from "@/app/componets/zustand/supplyItems";
import { useUserCart, useUserCartData, useUserCartTotal } from "@/app/componets/zustand/cart";
import { useUserTicket, useUserTicketData, useUserTicketTotal } from "@/app/componets/zustand/ticket";
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { FaDollarSign, FaPhoneAlt, FaUser } from "react-icons/fa";



const Profile = () => {

    //// Zustand
    const Id = useUserID((state) => state.userID)
    const theme = useUserTheme((state) => state.userTheme)
    const bizName = useUserName((state) => state.userName)
    const jina = useUserAccountName((state) => state.userAccountName)
    const pepe = useUserEmail((state) => state.userEmail)
    const simu = useUserPhone((state) => state.userPhone)
    const mboka = useUserRole((state) => state.userRole)

    ///// Change password 
    const auth = getAuth();

    const [forgotemail, setForgetemail] = useState('');
    const [isModalOpen, setModalOpen] = useState(false);

    const handleForgotPassword = () => {
        setModalOpen(true);
    };
    const closeModal = () => {
        setModalOpen(false);
    };

    const changepassword = async () => {

        if (forgotemail) {
            try {
                await sendPasswordResetEmail(auth, forgotemail);
                setForgetemail('');
                closeModal()
                passwordsuccessFun()

            } catch (error) {
                console.log("error on reset", error);
                setForgetemail('');
                closeModal()
                passwordFailFun()
            }
        } else {
            closeModal()
            passwodFailBlankFun()
        }
    };

    ///// Log out function 
    const router = useRouter();
    const handleLogout = async () => {
        try {
            await signOut(auth)
                .then(() => {
                    useUserID.persist.clearStorage();
                    useUserName.persist.clearStorage();
                    useUserEmail.persist.clearStorage();
                    useUserPhone.persist.clearStorage();
                    useUserRole.persist.clearStorage();
                    useUserAccountName.persist.clearStorage();



                    useUserEmployee.setState({ userEmployee: null })
                    useUserEmployeeTotal.setState({ userEmployeeTotal: null })
                    useUserItems.setState({ userItems: null })
                    useUserItemsTotal.setState({ userItemsTotal: null })
                    useUserItemsData.setState({ userItemsData: null })
                    useUserCategories.setState({ userCategories: null })
                    useUserCategoriesTotal.setState({ userCategoriesTotal: null })
                    useUserSupplier.setState({ userSupplier: null })
                    useUserSupplierTotal.setState({ userSupplierTotal: null })
                    useUserSupplyItems.setState({ userSupplyItems: null })
                    useUserSupplyItemsTotal.setState({ userSupplyItemsTotal: null })
                    useUserSupplyItemsData.setState({ userSupplyItemsData: null })
                    useUserCart.setState({ userCart: null })
                    useUserCartData.setState({ userCartData: null })
                    useUserCartTotal.setState({ userCartTotal: null })
                    useUserTicket.setState({ userTicket: null })
                    useUserTicketData.setState({ userTicketData: null })
                    useUserTicketTotal.setState({ userTicketTotal: null })

                    router.push('/');
                })

        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    //// Auto Profile Modal
    const [passwordModalsuccess, setPasswordSuccess] = useState(false);
    const [passwordModalFail, setPasswordFail] = useState(false);
    const [passwordModalFailBlank, setPasswordFailBlank] = useState(false);

    const passwordsuccessFun = () => {
        setPasswordSuccess(true);
        setTimeout(() => setPasswordSuccess(false), 1500);
    };

    const passwordFailFun = () => {
        setPasswordFail(true);
        setTimeout(() => setPasswordFail(false), 1500);
    };

    const passwodFailBlankFun = () => {
        setPasswordFailBlank(true);
        setTimeout(() => setPasswordFailBlank(false), 1500);
    };


    return (
        <div className={`min-h-screen 
        ${theme === "Dark"
                ? "text-white "
                : "bg-gray-200 text-black rounded-lg"
            }`}>

            {/* Content */}
            <div className="mb-10 p-5 max-w-4xl mx-auto">
                <section
                    className={`p-8
        ${theme === "Dark"
                            ? "text-white border rounded-xl border-blue-800"
                            : "bg-white text-black rounded-xl shadow-xl"
                        }`}
                >
                    {/* Header */}
                    <h2 className="text-md sm:text-xl font-semibold mb-8 text-center">
                        Account Settings
                    </h2>

                    {/* Profile */}
                    <div className="max-w-2xl mx-auto">
                        <h3 className="text-sm sm:text-lg font-semibold mb-4">
                            Employee Profile
                        </h3>

                        <div
                            className={`divide-y text-xs sm:text-sm
        ${theme === "Dark" ? "divide-blue-800" : "divide-gray-200"}
      `}
                        >
                            <div className="flex justify-between py-3">
                                <span className="font-medium opacity-70">Name</span>
                                <span>{jina}</span>
                            </div>

                            <div className="flex justify-between py-3">
                                <span className="font-medium opacity-70">Email</span>
                                <span>{pepe}</span>
                            </div>

                            <div className="flex justify-between py-3">
                                <span className="font-medium opacity-70">Phone</span>
                                <span>{simu}</span>
                            </div>

                            <div className="flex justify-between py-3">
                                <span className="font-medium opacity-70">Company</span>
                                <span>{bizName}</span>
                            </div>

                            <div className="flex justify-between py-3">
                                <span className="font-medium opacity-70">Role</span>
                                <span className="font-medium">{mboka}</span>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex justify-end gap-6 mt-6">
                            <button
                                onClick={handleForgotPassword}
                                className={`text-sm hover:underline text-xs sm:tetx-sm
          ${theme === "Dark" ? "text-blue-400" : "text-blue-700"}
        `}
                            >
                                Change Password
                            </button>

                            <button 
                                className={`text-white py-2 px-6 rounded-md text-xs sm:text-sm
          ${theme === "Dark"
                                        ? "bg-red-800 hover:bg-red-600"
                                        : "bg-red-600 hover:bg-red-700"
                                    }`}
                                onClick={handleLogout}
                            >
                                Log Out
                            </button>
                        </div>
                    </div>

                    {/* Divider */}
                    <div
                        className={`my-8 border-t
        ${theme === "Dark" ? "border-blue-800" : "border-gray-300"}
      `}
                    />

                    {/* Theme Settings */}
                    <div className="max-w-2xl mx-auto">
                        <h3 className="text-sm sm:text-lg font-semibold mb-4">
                            Theme Settings
                        </h3>

                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => useUserTheme.setState({ userTheme: "Light" })}
                                className={`py-2 px-5 rounded text-sm sm:text-sm
          ${theme === "Dark"
                                        ? "bg-gray-300 text-black hover:bg-gray-100"
                                        : "bg-gray-100 text-black hover:bg-gray-200 border shadow-sm"
                                    }`}
                            >
                                Light
                            </button>

                            <button
                                onClick={() => useUserTheme.setState({ userTheme: "Dark" })}
                                className={`py-2 px-5 rounded text-sm sm:text:sm
          ${theme === "Dark"
                                        ? "bg-blue-800 text-white hover:bg-blue-600"
                                        : "bg-blue-600 hover:bg-blue-800 text-white"
                                    }`}
                            >
                                Dark
                            </button>
                        </div>

                        <p className="mt-4 text-sm sm:text-sm opacity-70">
                            Current Theme: <span className="text-blue-500 font-medium">{theme}</span>
                        </p>
                    </div>
                </section>
            </div>



            {/* change password */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96" style={{ borderRadius: 9 }}>
                        <h2 className="text-md sm:text-2xl font-bold mb-4 text-gray-900">Reset Password</h2>
                        <p className="mb-4 text-gray-700 text-sm sm:text-base">Enter your email to receive a password reset link:</p>
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full p-3 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-[#303133] text-sm "
                            style={{ borderRadius: 9, color: "#000000" }}
                            value={forgotemail}
                            onChange={(e) => setForgetemail(e.target.value)}
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={closeModal}
                                className="bg-red-700 px-4 py-2 hover:bg-red-300 text-xs sm:text-sm"
                                style={{ borderRadius: 9, color: "#ffffff" }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={changepassword}
                                className="bg-blue-500 px-4 py-2 text-white  text-xs sm:text-sm"
                                style={{ borderRadius: 9, backgroundColor: '#303133' }}>
                                Send Reset Link
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {passwordModalsuccess && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className={` p-6 rounded-xl 
                    
                     ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white shadow-lg "
                        }`}>
                        <div className='flex justify-center'>

                            <TiTick className='text-green-600 text-4xl  ' />
                            <h2 className="text-lg font-bold mb-4">Success</h2>
                        </div>
                        <p>Password Changed</p>
                    </div>
                </div>
            )}

            {passwordModalFail && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className={` p-6 rounded-xl 
                    
                     ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white shadow-lg "
                        }`} >
                        <div className='flex justify-center'>
                            <TbXboxX className='text-red-600 text-3xl   ' />
                            <h2 className="text-lg font-bold mb-4 mx-1">Failed</h2>
                        </div>
                        <p>Password did not change</p>
                    </div>
                </div>
            )}

            {passwordModalFailBlank && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className={` p-6 rounded-xl 
                    
                     ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white shadow-lg "
                        }`}>
                        <div className='flex justify-center'>
                            <TbXboxX className='text-red-600 text-3xl   ' />
                            <h2 className="text-lg font-bold mb-4 mx-1">Failed</h2>
                        </div>
                        <p>Fill all Fields</p>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Profile;
