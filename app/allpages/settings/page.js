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
import { GiPadlock } from "react-icons/gi";
import { AiFillEye, AiFillEyeInvisible } from "react-icons/ai";
import { useUserLogs, useUserLogsData, useUserLogsTotal } from "@/app/componets/zustand/logs";
import { useUserCustomers, useUserCustomersData, useUserCustomersTotal } from "@/app/componets/zustand/customers";


const Settings = () => {

    //// Zustand
    const Id = useUserID((state) => state.userID)
    const employees = useUserEmployee((state) => state.userEmployee)
    const employeestotal = useUserEmployeeTotal((state) => state.userEmployeeTotal)
    const theme = useUserTheme((state) => state.userTheme)
    const bizName = useUserName((state) => state.userName)

    //// General variables

    const [employeeName, setEmployeeName] = useState('')
    const [employeeEmail, setEmployeeEmail] = useState('')
    const [employeeRole, setEmployeeRole] = useState('')
    const [employeePassword, setEmployeePassword] = useState('')
    const [employeePhoneInput, setemployeePhoneInput] = useState('')

    const [errorMessage, setErrorMessage] = useState("");

    const [userName, setUserName] = useState('')
    const [userEmail, setUserEmail] = useState('')
    const [userPhone, setUserPhone] = useState('')


    /// Edit profile 
    const editProfile = async () => {
        if (Id) {
            if (userName && userPhone) {

                try {
                    const dbRef = ref(db, `web/pos/${Id}`);
                    await update(dbRef, {
                        Name: userName,
                        Phone: userPhone,
                    });

                    setUserName('')
                    setUserPhone('')
                    editAdminsuccessFun()
                }
                catch {
                    console.log('did not edit')
                    editAdminFailFun()
                }
            }
            else {
                console.log('fill all fields')
                editAdminFailBlankFun()
            }
        }

    };

    //// Add Employee
    const handleAddEmployee = async () => {

        if (Id) {

            if (employeeName && employeePhoneInput && employeeEmail && employeePassword) {
                try {

                    try {
                        const userCredential = await createUserWithEmailAndPassword(auth, employeeEmail, employeePassword);
                        const user = userCredential.user;

                        try {
                            await sendEmailVerification(user, {
                                handleCodeInApp: true,
                                url: "https://chisendposproduction0011.firebaseapp.com",
                            });
                        } catch (err) {
                            console.log("Verification email error:", err);
                        }

                        const userAccountId = Id

                        const newbranchRef1 = push(ref(db, `user/accounts/`), {
                            Email: employeeEmail,
                            Id: userAccountId,
                            Phone: employeePhoneInput,
                            Name: bizName,
                            UserName: employeeName,
                            Role: employeeRole,
                            Password: employeePassword,
                            CreatedAt: Date.now(),
                        });

                        const newCreditKey1 = newbranchRef1.key;


                        const dbRef = ref(db, `web/pos/${Id}/employees`);
                        const newbranchRef = push(dbRef, {

                            Name: employeeName,
                            Phone: employeePhoneInput,
                            Email: employeeEmail,
                            AccountId: newCreditKey1,
                            Role: employeeRole,
                            Password: employeePassword,
                            CreatedAt: Date.now(),

                        });

                        const newCreditKey = newbranchRef.key;

                        setEmployeeName('')
                        setEmployeeEmail('')
                        setEmployeePassword('')
                        setEmployeeRole('')
                        setemployeePhoneInput('')

                        addEmployeesuccessFun()


                    } catch (error) {
                        console.log("Registration error:", error.message);
                        if (error.message.includes("email-already")) {
                            setErrorMessage("Email already exists!");
                        } else {
                            setErrorMessage("Registration failed. Try again.");
                        }
                    }

                }
                catch {
                    console.log('did not Add employee')
                    addEmployeeFailFun()
                }
            }
            else {
                console.log('fill all fields')
                addEmployeeFailBlankFun()
            }
        }
    };

    const handleRemoveEmployee = (id, accId) => {

        if (Id) {
            if (employeestotal == 1) {

                remove(ref(db, `web/pos/${Id}/employees`)).then(() => {
                    useUserEmployee.setState({ userEmployee: null });
                    useUserEmployeeTotal.setState({ userEmployeeTotal: null });
                })
                remove(ref(db, `user/accounts/${accId}`)).then(() => {
                })
                employeeModalFunDelete()
                deleteEmployeesuccessFun()
                    .catch((error) => {
                        employeeModalFunDelete()
                        deleteEmployeeFailFun()
                    });
            } else {
                remove(ref(db, `web/pos/${Id}/employees/${id}`)).then(() => {
                })
                remove(ref(db, `user/accounts/${accId}`)).then(() => {
                })
                employeeModalFunDelete()
                deleteEmployeesuccessFun()
                    .catch((error) => {
                        employeeModalFunDelete()
                        deleteEmployeeFailFun()
                    });
            }
        }
    };


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



                    useUserCustomers.setState({ userCustomers: null })
                    useUserCustomersTotal.setState({ userCustomersTotal: null })
                    useUserCustomersData.setState({ userCustomersData: null })
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
                    useUserLogs.setState({ userLogs: null })
                    useUserLogsData.setState({ userLogsData: null })
                    useUserLogsTotal.setState({ userLogsTotal: null })

                    router.push('/');
                })

        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const [employeeEditName, setEmployeeEditName] = useState('')

    const [employeeEditPhone, setEmployeeEditPhone] = useState('')
    const [employeeEditRole, setEmployeeEditRole] = useState('')

    //// Auto Employee modals
    const [addEmployeeModalsuccess, setAddEmployeesuccess] = useState(false);
    const [addEmployeeModalFail, setAddEmployeeFail] = useState(false);
    const [addEmployeeModalFailBlank, setAddEmployeeFailBlank] = useState(false);

    const [deleteEmployeeModalsuccess, setDeleteEmployeesuccess] = useState(false);
    const [deleteEmployeeModalFail, setDeleteEmployeeFail] = useState(false);


    const addEmployeesuccessFun = () => {
        setAddEmployeesuccess(true);
        setTimeout(() => setAddEmployeesuccess(false), 1500);
    };

    const addEmployeeFailFun = () => {
        setAddEmployeeFail(true);
        setTimeout(() => setAddEmployeeFail(false), 1500);
    };

    const addEmployeeFailBlankFun = () => {
        setAddEmployeeFailBlank(true);
        setTimeout(() => setAddEmployeeFailBlank(false), 1500);
    };

    const deleteEmployeesuccessFun = () => {
        setDeleteEmployeesuccess(true);
        setTimeout(() => setDeleteEmployeesuccess(false), 1500);
    };

    const deleteEmployeeFailFun = () => {
        setDeleteEmployeeFail(true);
        setTimeout(() => setDeleteEmployeeFail(false), 1500);
    };


    //// Auto Profile Modal
    const [editAdminModalsuccess, setEditAdminsuccess] = useState(false);
    const [editAdminModalFail, setEditAdminFail] = useState(false);
    const [editAdminModalFailBlank, setEditAdminFailBlank] = useState(false);

    const [passwordModalsuccess, setPasswordSuccess] = useState(false);
    const [passwordModalFail, setPasswordFail] = useState(false);
    const [passwordModalFailBlank, setPasswordFailBlank] = useState(false);


    const editAdminFailBlankFun = () => {
        setEditAdminFailBlank(true);
        setTimeout(() => setEditAdminFailBlank(false), 1500);
    };

    const editAdminsuccessFun = () => {
        setEditAdminsuccess(true);
        setTimeout(() => setEditAdminsuccess(false), 1500);
    };

    const editAdminFailFun = () => {
        setEditAdminFail(true);
        setTimeout(() => setEditAdminFail(false), 1500);
    };

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

    const [editRoleModalsuccess, setEditRolesuccess] = useState(false);
    const [editRoleModalFail, setEditRoleFail] = useState(false);

    const editRolesuccessFun = () => {
        setEditRolesuccess(true);
        setTimeout(() => setEditRolesuccess(false), 1500);
    };

    const editRoleFailFun = () => {
        setEditRoleFail(true);
        setTimeout(() => setEditRoleFail(false), 1500);
    };

    const [roleModalEdit, setRoleModalEdit] = useState(false)
    const roleModalFunEdit = () => {

        setRoleModalEdit(false)
    }
    const roleModalFunBtnEdit = () => setRoleModalEdit(true)

    const [editEmployeeModalsuccess, setEditEmployeesuccess] = useState(false);
    const [editEmployeeModalFail, setEditEmployeeFail] = useState(false);

    const editEmployeesuccessFun = () => {
        setEmployeeModalEdit(false)
        setEditEmployeesuccess(true);
        setTimeout(() => setEditEmployeesuccess(false), 1500);
    };

    const editEmployeeFailFun = () => {
        setEmployeeModalEdit(false)
        setEditEmployeeFail(true);
        setTimeout(() => setEditEmployeeFail(false), 1500);
    };

    const [employeeModalEdit, setEmployeeModalEdit] = useState(false)

    const employeeModalFunEdit = () => {
        setEmployeeEditName('')
        setEmployeeEditPhone('')
        setEmployeeEditRole('')
        setEmployeeModalEdit(false)
    }

    const employeeModalFunBtnEdit = () => setEmployeeModalEdit(true)

    const [employeeId, setEmployeeId] = useState('')
    const [employeeAccId, setEmployeeAccId] = useState('')

    const handleEditEmployee = (id, accId, jina, phone, role) => {
        setEmployeeEditName(jina)
        setEmployeeEditPhone(phone)
        setEmployeeEditRole(role)
        setEmployeeAccId(accId)
        setEmployeeId(id)
        employeeModalFunBtnEdit()
    }

    const handleDeleteEmployeeModal = (id, accId, jina, phone, role) => {
        setEmployeeEditName(jina)
        setEmployeeEditPhone(phone)
        setEmployeeEditRole(role)
        setEmployeeAccId(accId)
        setEmployeeId(id)
        employeeModalFunBtnDelete()
    }



    const [employeeModalDelete, setEmployeeModalDelete] = useState(false)

    const employeeModalFunDelete = () => {
        setEmployeeEditName('')
        setEmployeeEditPhone('')
        setEmployeeEditRole('')
        setEmployeeModalDelete(false)
    }

    const employeeModalFunBtnDelete = () => setEmployeeModalDelete(true)



    const editEmployeeFun = async () => {

        if (employeeEditName && employeeEditPhone && employeeEditRole) {

            try {
                const dbRef = ref(db, `user/accounts/${employeeAccId}`);
                await update(dbRef, {
                    Name: employeeEditName,
                    Role: employeeEditRole,
                    Phone: employeeEditPhone,
                });

                const dbRef1 = ref(db, `web/pos/${Id}/employees/${employeeId}`);
                await update(dbRef1, {

                    Name: employeeEditName,
                    Phone: employeeEditPhone,
                    Role: employeeEditRole,
                });

                setEmployeeEditName('')
                setEmployeeEditPhone('')
                setEmployeeEditRole('')
                setEmployeeAccId('')
                editEmployeesuccessFun()
            }
            catch {
                console.log('did not edit')
                editEmployeeFailFun()
            }
        }
        else {
            console.log('fill all fields')
            editAdminFailBlankFun()
        }

    }
    const rolePages = {
        Admin: ["Dashboard", "Inventory", "Receipts", "Debt", "Reports", "Suppliers", "Settings"],
        Manager: ["Inventory", "Receipts", "Debt", "Reports", "Suppliers", "Profile"],
        Cashier: ["Dashboard", "Receipts", "Debt", "Profile"],
    };


    const [showPassword, setShowPassword] = useState(false);



    return (


        <div className={`min-h-screen 
        ${theme === "Dark"
                ? "text-white "
                : "bg-gray-200 text-black rounded-lg"
            }`}>


            {/* Content */}
            <div className=" grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10 p-5  ">
                {/* User Profile */}
                <section className={`py-4 px-4  
                    
                    ${theme === "Dark"
                        ? "text-white border rounded-xl border-blue-800"
                        : "bg-gray-100 text-black  rounded-md  shadow-xl "
                    }
                    `}>
                    <h2 className="text-sm sm:text-lg font-bold mb-4">User Profile</h2>
                    <div>
                        <label htmlFor="username" className="block font-medium mb-2 text-xs sm:text-base">
                            Business Name:
                        </label>
                        <input
                            type="text"
                            id="username"
                            placeholder="Edit your Business Name"
                            className={`px-3 py-2 w-full mb-4 rounded-md text-sm sm:text-base
      ${theme === "Dark" ? "bg-gray-300" : "border text-black shadow-lg"}
    `}
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                        />

                        <div className="flex flex-col md:flex-row md:gap-10">

                            <div className="w-full md:w-1/2">
                                <label htmlFor="phone" className="block font-medium mb-2 text-xs sm:text-base">
                                    Phone Number:
                                </label>
                                <input
                                    type="number"
                                    id="phone"
                                    placeholder="Edit Phone Number"
                                    className={`w-full border rounded px-3 py-2 mb-4 text-sm sm:text-base
          ${theme === "Dark" ? "bg-gray-300" : "border text-black shadow-lg"}
        `}
                                    value={userPhone}
                                    onChange={(e) => setUserPhone(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row md:justify-between gap-2">
                            <button
                                className={`py-2 px-4   rounded-md   text-xs sm:text-base
        ${theme === "Dark"
                                        ? "text-white bg-blue-800 hover:bg-blue-600"
                                        : "bg-blue-600 text-white hover:bg-blue-800"}
      `}
                                onClick={editProfile}
                            >
                                Edit Profile
                            </button>

                            <button
                                onClick={handleForgotPassword}
                                className={`hover:underline text-xs sm:text-sm sm:my-0 my-3
        ${theme === "Dark" ? "text-blue-400" : "text-blue-700"}
      `}
                            >
                                Change Password..
                            </button>

                            <button
                                className={`text-white py-2 px-4 rounded-md text-xs sm:text-base
        ${theme === "Dark"
                                        ? "bg-red-800 hover:bg-red-600"
                                        : "bg-red-600 hover:bg-red-700"}
      `}
                                onClick={handleLogout}
                            >
                                Log Out
                            </button>
                        </div>
                    </div>

                </section>

                {/* Employee Management */}
                <section className={`p-4 
                    ${theme === "Dark"
                        ? "text-white border rounded-xl border-blue-800 "
                        : "bg-gray-100 text-black  rounded-md shadow-xl "
                    }
                    `}>
                    <h2 className="text-sm sm:text-lg font-bold mb-4">Manage Employees</h2>
                    <div className="mb-4">

                        {/* EMPLOYEE NAME */}
                        <input
                            type="text"
                            placeholder="Employee Name"
                            value={employeeName}
                            onChange={(e) => setEmployeeName(e.target.value)}
                            className={`rounded px-3 py-3 w-full mb-3  text-sm sm:text-base
            ${theme === "Dark"
                                    ? "bg-gray-300 text-black"
                                    : "border text-black shadow-lg"}
        `}
                        />

                        {/* EMAIL + PHONE ON SAME LINE */}
                        <div className="flex gap-3 mb-3">
                            <input
                                type="text"
                                placeholder="Phone Number"
                                value={employeePhoneInput}
                                onChange={(e) => setemployeePhoneInput(e.target.value)}
                                className={`rounded px-3 py-3 w-full text-xs sm:text-sm
                ${theme === "Dark"
                                        ? "bg-gray-300 text-black"
                                        : "border text-black shadow-lg"}
            `}
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={employeeEmail}
                                onChange={(e) => setEmployeeEmail(e.target.value)}
                                className={`rounded px-3 py-3 w-full text-xs sm:text-sm
                ${theme === "Dark"
                                        ? "bg-gray-300 text-black"
                                        : "border text-black shadow-lg"}
            `}
                            />
                        </div>

                        {/* DROPDOWN + PASSWORD ON SAME LINE */}
                        <div className="flex gap-3 mb-3">
                            {/* ROLE DROPDOWN */}
                            <select
                                value={employeeRole}
                                onChange={(e) => setEmployeeRole(e.target.value)}
                                className={`rounded px-3 py-3 w-full  text-xs sm:text-sm
                ${theme === "Dark"
                                        ? "bg-gray-300 text-black"
                                        : "border text-black shadow-lg"}
            `}
                            >
                                <option value="">Select Role</option>
                                <option value="Admin">Admin</option>
                                <option value="Manager">Manager</option>
                                <option value="Cashier">Cashier</option>
                            </select>

                            {/* PASSWORD */}



                            <div className="relative w-full">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Password .... 6+ Characters..."
                                    className={`w-full px-3 py-3 rounded  text-xs sm:text-sm transition duration-300
                                           ${theme === "Dark"
                                            ? "bg-gray-300 text-black"
                                            : "border text-black shadow-lg"}
            `}

                                    style={{ color: "#000000" }}
                                    value={employeePassword}
                                    onChange={(e) => setEmployeePassword(e.target.value)}
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
                        </div>

                        {/* BUTTON */}
                        <button
                            onClick={handleAddEmployee}
                            className={`py-2 px-4 rounded my-2 w-1/2 sm:w-1/4 font-semibold text-xs sm:text-sm
            ${theme === "Dark"
                                    ? "text-white bg-blue-800 hover:bg-blue-600"
                                    : "bg-blue-600 text-white hover:bg-blue-800"}
        `}
                        >
                            Add Employee
                        </button>

                    </div>

                </section>


                {/* Theme Settings */}
                <section className={`  p-4 
                      ${theme === "Dark"
                        ? "text-white border rounded-xl border-blue-800 "
                        : "bg-gray-100 text-black  rounded-md shadow-xl "
                    }
                    `}>
                    <h2 className="text-sm sm:text-lg font-bold mb-4">Theme Settings</h2>
                    <div>
                        <button
                            onClick={() => useUserTheme.setState({ userTheme: "Light" })}
                            className={`py-2 px-4 rounded mr-2 text-xs sm:text-base ${theme === "Dark"
                                ? "bg-gray-300 text-black hover:bg-gray-100"
                                : "bg-gray-100 text-black hover:bg-gray-200 rounded border shadow-lg"
                                }`}
                        >
                            Light
                        </button>
                        <button
                            onClick={() => useUserTheme.setState({ userTheme: "Dark" })}
                            className={`py-2 px-4 rounded text-xs sm:text-base ${theme === "Dark"
                                ? "bg-blue-800  text-white hover:bg-blue-600"
                                : "bg-blue-600 hover:bg-blue-800 text-white"
                                }`}
                        >
                            Dark
                        </button>
                    </div>
                    <p className="mt-4 font-medium text-xs sm:text-base">
                        Current Theme:
                        <span className="text-blue-500 text-xs sm:text-base" >{theme}</span>
                    </p>
                </section>

                <section
                    className={`py-4 px-4
    ${theme === "Dark"
                            ? "text-white border rounded-xl border-blue-800"
                            : "bg-gray-100 text-black rounded-md shadow-xl"
                        }
  `}
                >
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <h2 className=" text-sm sm:text-lg font-bold">Employees</h2>

                        <button
                            className={`px-3 py-1 rounded text-sm sm:text-lg
        ${theme === "Dark"
                                    ? "text-white bg-green-800 hover:bg-green-600"
                                    : "bg-green-600 text-white hover:bg-green-800"
                                }
      `}
                            onClick={() => roleModalFunBtnEdit()}
                        >
                            Manage Roles
                        </button>
                    </div>

                    {/* Column Titles – DESKTOP ONLY */}
                    <div
                        className={`hidden md:grid md:grid-cols-12 gap-2 px-3 py-2 mb-2 text-sm font-semibold
    ${theme === "Dark"
                                ? "text-gray-200 border-b border-blue-800"
                                : "text-gray-600 border-b border-gray-300"
                            }
  `}
                    >
                        <div className="col-span-2">Name</div>
                        <div className="col-span-3">Email</div>
                        <div className="col-span-2">Phone</div>
                        <div className="col-span-1">Role</div>
                        <div className="col-span-2">Password</div>
                        <div className="col-span-2">Actions</div>
                    </div>

                    {/* Employees List */}
                    <ul className="space-y-3">
                        {employees && employees.map((employee, index) => (
                            <li
                                key={index}
                                className={`grid grid-cols-1 md:grid-cols-12 gap-2 p-4 border rounded text-xs sm:text-sm
        ${theme === "Dark"
                                        ? "bg-gray-300 text-black"
                                        : "bg-gray-100"
                                    }
      `}
                            >
                                {/* Name */}
                                <div className="md:col-span-2 font-medium">
                                    <span className="md:hidden font-semibold">Name: </span>
                                    {employee.Name}
                                </div>
                                {/* Email */}
                                <div className="md:col-span-3 sm:text-xs  break-all">
                                    <span className="md:hidden font-semibold">Email: </span>
                                    {employee.Email}
                                </div>

                                {/* Phone */}
                                <div className="md:col-span-2 sm:text-xs   ">
                                    <span className="md:hidden font-semibold">Phone: </span>
                                    {employee.Phone}
                                </div>

                                {/* Role */}
                                <div className="md:col-span-1 sm:text-xs font-semibold">
                                    <span className="md:hidden">Role: </span>
                                    {employee.Role}
                                </div>

                                {/* Password */}
                                <div className="md:col-span-2 sm:text-xs break-all">
                                    <span className="md:hidden font-semibold">Password: </span>
                                    {employee.Password}
                                </div>

                                {/* Actions */}
                                {employee.Password && (
                                    <div className="md:col-span-2 flex gap-2 md:justify-end">
                                        <button
                                            onClick={() =>
                                                handleEditEmployee(
                                                    employee.id,
                                                    employee.AccountId,
                                                    employee.Name,
                                                    employee.Phone,
                                                    employee.Role
                                                )
                                            }
                                            className={`px-3 py-1 rounded text-xs sm:text-xs
            ${theme === "Dark"
                                                    ? "text-white bg-blue-800 hover:bg-blue-600"
                                                    : "bg-blue-600 text-white hover:bg-blue-800"
                                                }
          `}
                                        >
                                            Edit
                                        </button>
                                        <button
                                            onClick={() =>
                                                handleDeleteEmployeeModal(
                                                    employee.id,
                                                    employee.AccountId,
                                                    employee.Name,
                                                    employee.Phone,
                                                    employee.Role
                                                )
                                            }
                                            className={`px-3 py-1 rounded text-xs sm:text-xs
              ${theme === "Dark"
                                                    ? "text-white bg-red-800 hover:bg-red-600"
                                                    : "bg-red-600 text-white hover:bg-red-800"
                                                }
            `}
                                        >
                                            Remove
                                        </button>
                                    </div>
                                )}
                            </li>
                        ))}
                    </ul>

                </section>



            </div>

            {/* change password */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center">
                    <div className="bg-white p-6 rounded-lg shadow-lg w-96 mx-4" style={{ borderRadius: 9 }}>
                        <h2 className=" text-md sm:text-2xl font-bold mb-4 text-gray-900">Reset Password</h2>
                        <p className="mb-4 text-gray-700 text-xs sm:text-md">Enter your email to receive a password reset link:</p>
                        <input
                            type="email"
                            placeholder="Email"
                            className="w-full p-3 border border-gray-300 rounded mb-4 focus:outline-none focus:ring-2 focus:ring-[#303133] text-sm sm:text-base"
                            style={{ borderRadius: 9, color: "#000000" }}
                            value={forgotemail}
                            onChange={(e) => setForgetemail(e.target.value)}
                        />
                        <div className="flex justify-end space-x-2">
                            <button
                                onClick={closeModal}
                                className="bg-red-700 px-4 py-2 hover:bg-red-300 text-xs sm:text-base"
                                style={{ borderRadius: 9, color: "#ffffff" }}
                            >
                                Cancel
                            </button>
                            <button
                                onClick={changepassword}
                                className="bg-blue-500 px-4 py-2 text-white  text-xs sm:text-base"
                                style={{ borderRadius: 9, backgroundColor: '#303133' }}>
                                Send Reset Link
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Employee edit  */}
            {employeeModalEdit && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className={` p-6 rounded-xl shadow w-96  mx-4
                                    ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white "
                        }`
                    }>
                        <h2 className=" text-md sm:text-lg font-bold mb-4 text-center">Edit Employee Details</h2>

                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Name"
                                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={employeeEditName}
                                    onChange={(e) => setEmployeeEditName(e.target.value)}
                                />
                                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>
                            <div className="relative ">
                                <input
                                    type="text"
                                    placeholder="Phone Number"
                                    className=" p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md  text-sm sm:text-base "
                                    style={{ color: "#000000" }}
                                    value={employeeEditPhone}
                                    onChange={(e) => setEmployeeEditPhone(e.target.value)}
                                />
                                < FaPhoneAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>

                            <div className="relative ">
                                <select
                                    value={employeeEditRole}
                                    onChange={(e) => setEmployeeEditRole(e.target.value)}
                                    className={`rounded px-3 py-3 w-full   text-sm sm:text-base
                ${theme === "Dark"
                                            ? "bg-gray-300 text-black"
                                            : "border text-black shadow-lg"}
            `}
                                >
                                    <option value="">Select Role</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Manager">Manager</option>
                                    <option value="Cashier">Cashier</option>
                                </select>
                            </div>

                        </div>

                        <div className=" flex flex-row justify-evenly">
                            <button
                                className={` text-white px-4 py-2 rounded  mt-4   text-xs sm:text-base
                                            
                                          ${theme === "Dark"
                                        ? "bg-green-800  hover:bg-green-600"
                                        : "bg-green-600  hover:bg-green-800 "
                                    }`}
                                onClick={editEmployeeFun}
                            >
                                Edit Employee
                            </button>
                            <button
                                className={` text-white px-4 py-2 rounded mt-4  text-xs sm:text-base
                                              ${theme === "Dark"
                                        ? "bg-red-800  hover:bg-red-600"
                                        : "bg-red-600  hover:bg-red-800 "
                                    }`}
                                onClick={employeeModalFunEdit}
                            >
                                Cancel
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* Manage Roles  */}

            {roleModalEdit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
                    <div
                        className={`p-6 rounded-2xl shadow-xl w-[420px] mx-4
                ${theme === "Dark" ? "bg-[#171941] text-white" : "bg-white text-black"}
            `}
                    >
                        {/* Header */}
                        <h2 className="  text-md sm:text-xl font-bold mb-5 text-center">
                            User Roles & Permissions
                        </h2>

                        {/* Roles */}
                        <div className="space-y-4">
                            {Object.entries(rolePages).map(([role, pages]) => (
                                <div
                                    key={role}
                                    className={`rounded-xl p-4 border
                            ${theme === "Dark"
                                            ? "border-gray-700 bg-[#1f224f]"
                                            : "border-gray-200 bg-gray-50"
                                        }
                        `}
                                >
                                    {/* Role title */}
                                    <div className="flex items-center justify-between mb-3">
                                        <span className="font-semibold  text-sm text-lg">
                                            {role}
                                        </span>
                                        <span
                                            className={`text-xs px-3 py-1 rounded-full 
                                    ${role === "Admin"
                                                    ? "bg-red-600 text-white"
                                                    : role === "Manager"
                                                        ? "bg-blue-600 text-white"
                                                        : "bg-green-600 text-white"
                                                }
                                `}
                                        >
                                            {pages.length} Pages
                                        </span>
                                    </div>

                                    {/* Pages */}
                                    <div className="flex flex-wrap gap-2">
                                        {pages.map((page) => (
                                            <span
                                                key={page}
                                                className={`text-xs px-3 py-1 rounded-full
                                        ${theme === "Dark"
                                                        ? "bg-gray-800 text-gray-200"
                                                        : "bg-white border text-gray-700"
                                                    }
                                    `}
                                            >
                                                {page}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end mt-6">
                            <button
                                className={`px-6 py-2 rounded-lg font-medium  text-xs sm:text-base
                        ${theme === "Dark"
                                        ? "bg-red-800 hover:bg-red-600 text-white"
                                        : "bg-red-600 hover:bg-red-800 text-white"
                                    }
                    `}
                                onClick={roleModalFunEdit}
                            >
                                Back
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {employeeModalDelete && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-80">
                    <div
                        className={`p-6 rounded-2xl shadow-xl w-96 mx-4
                ${theme === "Dark" ? "bg-[#171941] text-white" : "bg-white text-black"}
            `}
                    >
                        {/* Title */}
                        <h2 className="  text-md sm:text-lg font-bold mb-4 text-center">
                            Delete Employee
                        </h2>

                        {/* Employee Details */}
                        <div
                            className={`mt-4 rounded-xl p-4 space-y-3 border mx-4
                    ${theme === "Dark"
                                    ? "bg-[#1f224f] border-gray-700"
                                    : "bg-gray-50 border-gray-200"
                                }
                `}
                        >
                            <div className="flex justify-between text-xs sm:text-sm">
                                <span className="font-medium opacity-70">Name</span>
                                <span className="font-semibold">{employeeEditName}</span>
                            </div>

                            <div className="flex justify-between text-xs sm:text-sm">
                                <span className="font-medium opacity-70">Phone</span>
                                <span className="font-semibold">{employeeEditPhone}</span>
                            </div>

                            <div className="flex justify-between text-xs sm:text-sm">
                                <span className="font-medium opacity-70">Role</span>
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-semibold
                            ${theme === "Dark"
                                            ? "bg-gray-800 text-gray-200"
                                            : "bg-white border text-gray-700"
                                        }
                        `}
                                >
                                    {employeeEditRole}
                                </span>
                            </div>
                        </div>

                        {/* Warning */}
                        <p className="text-xs text-center mt-3 opacity-70">
                            This action cannot be undone.
                        </p>

                        {/* Actions */}
                        <div className="flex justify-evenly mt-6">
                            <button
                                className={`text-white px-5 py-2 rounded-lg text-xs sm:text-base
                        ${theme === "Dark"
                                        ? "bg-green-800 hover:bg-green-600"
                                        : "bg-green-600 hover:bg-green-800"
                                    }
                    `}
                                onClick={() =>
                                    handleRemoveEmployee(employeeId, employeeAccId)
                                }
                            >
                                Delete
                            </button>

                            <button
                                className={`text-white px-5 py-2 rounded-lg text-xs sm:text-base
                        ${theme === "Dark"
                                        ? "bg-red-800 hover:bg-red-600"
                                        : "bg-red-600 hover:bg-red-800"
                                    }
                    `}
                                onClick={employeeModalFunDelete}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Auto-Close Employees */}


            {editRoleModalsuccess && (
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
                        <p>Roles Saved</p>
                    </div>
                </div>
            )}

            {editRoleModalFail && (
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
                        <p>Roles were not Saved</p>
                    </div>
                </div>
            )}


            {editEmployeeModalsuccess && (
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
                        <p>Employee  was Edited</p>
                    </div>
                </div>
            )}

            {editEmployeeModalFail && (
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
                        <p>Edit was NOT suceessful</p>
                    </div>
                </div>
            )}

            {addEmployeeModalsuccess && (
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
                        <p>Employee was Added</p>
                    </div>
                </div>
            )}

            {addEmployeeModalFail && (
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
                        <p>Employee was not Added</p>
                    </div>
                </div>
            )}

            {addEmployeeModalFailBlank && (
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

            {deleteEmployeeModalsuccess && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className={` p-6 rounded-xl 
                    
                     ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white shadow-lg "
                        }`}>
                        <div className='flex justify-center'>
                            <TiTick className='text-green-600 text-4xl  ' />
                            <h2 className="text-lg font-bold mb-4">Deleted</h2>
                        </div>
                        <p>Employee was Deleted</p>
                    </div>
                </div>
            )}

            {deleteEmployeeModalFail && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className={` p-6 rounded-xl 
                    
                     ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white shadow-lg "
                        }`}>
                        <div className='flex justify-center'>
                            <TbXboxX className='text-red-600 text-3xl' />
                            <h2 className="text-lg font-bold mb-4 mx-1">Failed</h2>
                        </div>
                        <p>Employee was not Deleted</p>
                    </div>
                </div>
            )}


            {/**Password auto modal */}

            {editAdminModalsuccess && (
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
                        <p>Profile was Edited</p>
                    </div>
                </div>
            )}

            {editAdminModalFail && (
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
                        <p>Profile was not Edited</p>
                    </div>
                </div>
            )}

            {editAdminModalFailBlank && (
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
                        <p>Fill all fields</p>
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

export default Settings;
