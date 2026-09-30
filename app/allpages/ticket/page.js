"use client"

import React, { useState, useEffect } from "react";
import { ref, update, push, remove } from 'firebase/database';
import { db } from "../../../config";
import { MdEmail } from "react-icons/md"
import { useUserID } from "@/app/componets/zustand/profile";
import { useUserEmployee } from "@/app/componets/zustand/employees";
import { useUserTicket, useUserTicketData, useUserTicketTotal } from "@/app/componets/zustand/ticket";
import { useUserTheme } from "@/app/componets/zustand/theme";
import { FaReceipt, FaTicketAlt, FaUsers } from "react-icons/fa";
import { TiTick } from "react-icons/ti";
import { QRCodeSVG } from 'qrcode.react';
import { TbXboxX } from "react-icons/tb";
import { useUserCart, useUserCartData, useUserCartTotal } from "@/app/componets/zustand/cart";
import { FaCashRegister } from "react-icons/fa";
import { useUserEmail, useUserName, useUserPhone } from "@/app/componets/zustand/profile";



const Ticket = () => {


    // Zustand
    const Id = useUserID((state) => state.userID)
    const employees = useUserEmployee((state) => state.userEmployee)


    const bizName = useUserName((state) => state.userName)

    const bizEmail = useUserEmail((state) => state.userEmail)
    const bizPhone = useUserPhone((state) => state.userPhone)

    //  const items = useUserTicketData((state) => state.useTicketData)
    const items = useUserCartData((state) => state.userCartData)

    // const ticket = useUserTicket((state) => state.userTicket)
    const ticket = useUserCart((state) => state.userCart)

    //  const ticketTotal = useUserTicketTotal((state) => state.userTicketTotal)
    const ticketTotal = useUserCartTotal((state) => state.userCartTotal)
    const theme = useUserTheme((state) => state.userTheme)

    const [filteredTickets, setFilteredTickets] = useState(null);
    const [cart, setCart] = useState([]);

    const [selectedCashier, setSelectedCashier] = useState("");

    const [selectedEmployee, setSelectedEmployee] = useState(null);

    /* ===================== DATE / TIME FILTER (like Reports) ===================== */

    const [dateModal, setDateModal] = useState(false);
    const [activeTab, setActiveTab] = useState("day");
    const [filterDay, setFilterDay] = useState("");
    const [filterWeek, setFilterWeek] = useState("");
    const [filterMonth, setFilterMonth] = useState("");
    const [filterYear, setFilterYear] = useState(new Date().getFullYear());
    const [dateFilterApplied, setDateFilterApplied] = useState(false);

    const DateModalFunBtn = () => setDateModal(true);
    const DateModalFun = () => setDateModal(false);

    const filterByDay = (list, day) => {
        const startOfDay = new Date(day).setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(day).setUTCHours(23, 59, 59, 999);
        return list.filter((t) => {
            const d = Number(t.Date);
            return d >= startOfDay && d <= endOfDay;
        });
    };

    const filterByWeek = (list, week) => {
        const [year, wk] = week.split("-W").map(Number);
        const firstDayOfYear = new Date(Date.UTC(year, 0, 1));
        const dayOfWeek = firstDayOfYear.getUTCDay();
        const firstISOWeekStart = new Date(Date.UTC(year, 0, 1 + ((dayOfWeek <= 4 ? -dayOfWeek + 1 : 8 - dayOfWeek))));
        const startOfWeek = new Date(firstISOWeekStart.getTime() + (wk - 1) * 7 * 24 * 60 * 60 * 1000);
        const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);
        startOfWeek.setUTCHours(0, 0, 0, 0);
        endOfWeek.setUTCHours(23, 59, 59, 999);
        return list.filter((t) => t.Date >= startOfWeek.getTime() && t.Date <= endOfWeek.getTime());
    };

    const filterByMonth = (list, year, month) => {
        const m = parseInt(month.split("-")[1], 10);
        const startOfMonth = new Date(year, m - 1, 1).getTime();
        const endOfMonth = new Date(year, m, 0, 23, 59, 59, 999).getTime();
        return list.filter((t) => t.Date >= startOfMonth && t.Date <= endOfMonth);
    };

    const filterByYear = (list, year) => {
        const startOfYear = new Date(year, 0, 1).getTime();
        const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999).getTime();
        return list.filter((t) => t.Date >= startOfYear && t.Date <= endOfYear);
    };

    // Builds the ticket list for display, combining the employee filter and (optionally) the date filter
    const getFilteredList = (employeeName, useDateFilter) => {
        if (!ticket) return null;

        let base = employeeName ? ticket.filter((t) => t.EmployeeID === employeeName) : ticket;

        if (useDateFilter) {
            switch (activeTab) {
                case "day":
                    base = filterByDay(base, filterDay);
                    break;
                case "week":
                    base = filterByWeek(base, filterWeek);
                    break;
                case "month":
                    base = filterByMonth(base, filterYear, filterMonth);
                    break;
                case "year":
                    base = filterByYear(base, filterYear);
                    break;
                default:
                    break;
            }
        }

        return base.length ? base : null;
    };

    const applyDateFilter = () => {
        setDateFilterApplied(true);
        setFilteredTickets(getFilteredList(selectedEmployee, true));
        setDateModal(false);
    };

    const clearDateFilter = () => {
        setDateFilterApplied(false);
        setFilterDay("");
        setFilterWeek("");
        setFilterMonth("");
        setFilterYear(new Date().getFullYear());
        setFilteredTickets(getFilteredList(selectedEmployee, false));
        setDateModal(false);
    };

    /* ===================== EMPLOYEE FILTER ===================== */

    //// Filter tickets for the selected employee
    const handleEmployeeClick = (employeeName) => {
        setSelectedEmployee(employeeName);
        setCart([]);
        setFilteredTickets(getFilteredList(employeeName, dateFilterApplied));
    };

    const [receiptNumber, setReceiptNumber] = useState("")

    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");

    // NEW: full sale breakdown for the receipt (delivery fee, payments, balances, etc)
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [grandTotalState, setGrandTotalState] = useState(0);
    const [payments, setPayments] = useState([]); // [{ method, amount }, ...]
    const [paymentType, setPaymentType] = useState("Full"); // "Full" | "Partial"
    const [paymentModeState, setPaymentModeState] = useState("Single"); // "Single" | "Split"
    const [customerName, setCustomerName] = useState("");
    const [amountPaidState, setAmountPaidState] = useState(0);
    const [balanceState, setBalanceState] = useState(0);
    const [changeState, setChangeState] = useState(0);

    const handleTicketClick = (t) => {
        setCart(t.Cart || []);
        setSelectedCashier(t.EmployeeID);
        setReceiptNumber(t.CashSale);

        const subtotal = Number(t.Total) || calculateTotal(t.Cart || []);
        const delivery = Number(t.DeliveryFee) || 0;
        const grand = Number(t.GrandTotal) || (subtotal + delivery);

        setDeliveryFee(delivery);
        setGrandTotalState(grand);

        // Support the new `Payments` array, fall back to a legacy single `Payment` string,
        // and finally assume Cash for very old records that have no payment info at all.
        let pays = [];
        if (Array.isArray(t.Payments) && t.Payments.length > 0) {
            pays = t.Payments;
        } else if (t.Payment) {
            pays = [{ method: t.Payment, amount: subtotal }];
        } else {
            pays = [{ method: "Cash", amount: grand }];
        }
        setPayments(pays);

        setPaymentType(t.PaymentType || "Full");
        setPaymentModeState(t.PaymentMode || "Single");
        setCustomerName(t.Customer || "");
        setAmountPaidState(Number(t.AmountPaid) || grand);
        setBalanceState(Number(t.Balance) || 0);
        setChangeState(Number(t.Change) || 0);

        const jsDate = new Date(t.Date); // Convert timestamp to JS Date

        // Extract date: dd/mm/yyyy
        const day = String(jsDate.getDate()).padStart(2, "0");
        const month = String(jsDate.getMonth() + 1).padStart(2, "0"); // Months are zero-based
        const year = jsDate.getFullYear();
        const dateOnly = `${day}/${month}/${year}`;

        // Extract time: hh:mm:ss
        const timeOnly = jsDate.toTimeString().split(" ")[0];

        setSelectedDate(dateOnly); // dd/mm/yyyy
        setSelectedTime(timeOnly); // hh:mm:ss
    };




    /// Maintain the total function
    const calculateTotal = (cart) => {
        if (!cart || cart.length === 0) {
            return 0;
        }
        return cart.reduce((sum, item) => sum + (item.stock * item.Price), 0);
    };

    useEffect(() => {
        setTotal(calculateTotal(cart));
    }, [cart]);



    /// General Variables
    const [selectEmployee, setSelectEmployee] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [total, setTotal] = useState(0);


    /// Modals
    const [sendModal, setSendModal] = useState(false);
    const [receiptModal, setReceiptModal] = useState(false);
    const [receiptModal1, setReceiptModal1] = useState(false);

    const receiptModalFun = () => setReceiptModal(false);

    const sendModalFun = () => {
        setSelectEmployee("")
        setSelectedCashier('')

        setSendModal(false);
    }


    /// send to db
    const handleSend = () => {
        if (Id) {
            if (selectEmployee) {
                if (total == 0) {
                    console.log("total is zero")
                    sendModalFun()
                    sendFail()
                }
                else {
                    try {
                        const dbRef = ref(db, `web/pos/${Id}/cart/`);
                        const newbranchRef = push(dbRef, {

                            EmployeeID: selectEmployee,
                            Cart: cart,
                            Total: total,
                            Date: Date.now()

                        });
                        const newCreditKey = newbranchRef.key;

                        sendModalFun()
                        sendSuccess()
                        deleteTicket(selectEmployee)
                    }
                    catch {
                        console.log("did not send to DB")
                        sendModalFun()
                        sendFail()
                    }
                }
            }
            else {
                console.log("did not select employee ")
                sendModalFun()
                sendFailEmployee()

            }
        }
    };

    const [deleteId, setDeleteId] = useState()

    const sendFunction = (id) => {

        setSendModal(true)
        setDeleteId(id)

    }

    const deleteTicket = (employee) => {

        if (Id) {

            if (ticketTotal == 1) {

                remove(ref(db, `web/pos/${Id}/ticket`)).then(() => {

                    useUserTicket.setState({ userTicket: null });
                    useUserTicketTotal.setState({ userTicketTotal: null });
                    setFilteredTickets(null)

                })
                    .catch((error) => {
                        console.log("ticket was not deleted")
                    });

            } else {
                remove(ref(db, `web/pos/${Id}/ticket/${deleteId}`)).then(() => {
                    console.log("ticket was deleted")

                    handleEmployeeClick(employee)

                })
                    .catch((error) => {
                        console.log("ticket was not deleted")
                    });
            }

        }

    }


    ////  Auto close modals
    const [sendModalSuccess, setSendModalSuccess] = useState(false);
    const [sendModalFail, setSendModalFail] = useState(false);
    const [sendModalFailEmployee, setSendModalFailEmployee] = useState(false);


    const sendSuccess = () => {
        setSendModalSuccess(true);
        setTimeout(() => setSendModalSuccess(false), 1500);
    };


    const sendFail = () => {
        setSendModalFail(true);
        setTimeout(() => setSendModalFail(false), 1500);
    };


    const sendFailEmployee = () => {
        setSendModalFailEmployee(true);
        setTimeout(() => setSendModalFailEmployee(false), 1500);
    };

    ///////////////////////////////////////////////////////////////////////////////////////////

    const totalItems = cart.length;
    const totalQty = cart.reduce((sum, item) => sum + parseInt(item.stock), 0);
    const totalWeight = cart.reduce((sum, item) => sum + (parseFloat(item.Weight || 0) * parseInt(item.stock)), 0);

    // VAT Breakdown logic
    const vatBreakdown = {
        A: { vatable: 0, vat: 0 },
        E: { vatable: 0, vat: 0 },
        Z: { vatable: 0, vat: 0 }
    };

    cart.forEach(item => {
        const code = item.vatCode || 'A'; // Default to 'A' if not provided
        const qty = parseInt(item.stock);
        const price = parseFloat(item.Price);
        const vatableAmount = price * qty;
        const vatAmount = code === 'A' ? vatableAmount * 0.16 : 0; // 16% VAT for code A

        if (vatBreakdown[code]) {
            vatBreakdown[code].vatable += vatableAmount;
            vatBreakdown[code].vat += vatAmount;
        }
    });

    const format = (val) => (Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const displayGrandTotal = grandTotalState || (total + deliveryFee);


    return (

        <div className={`min-h-screen flex flex-col 
                  ${theme === "Dark"
                ? "text-white "
                : "bg-white text-black rounded-lg"
            }`}>

            {/* Main Layout */}
            {!receiptModal && (
                <div
                    className={`flex flex-col lg:flex-row flex-grow p-1 md:w-3/4 w-full mx-auto ${theme === "Dark" ? "text-white" : "bg-gray-100 text-black rounded-lg"
                        }`}
                >

                    {/* LEFT COLUMN: Employees & Receipts Stacked */}
                    <aside className=" border-r sm:w-1/3 shadow-xl rounded-lg h-screen sm:h-screen flex flex-col overflow-hidden">

                        {/* Upper Half: Employees Section */}
                        <div className="p-6 flex flex-col h-auto border-b">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm sm:text-lg font-bold">Employees</h3>
                            </div>
                            <div className="flex-1 overflow-x-auto py-2 px-2">
                                <div className="flex space-x-3">
                                    {employees && employees.length ? employees.map((employee, index) => (
                                        <button
                                            key={index}
                                            onClick={() => handleEmployeeClick(employee.Name)}
                                            className={`flex-shrink-0 flex items-center justify-center px-4 py-2 rounded-lg shadow transition-all duration-200

  ${selectedEmployee === employee.Name
                                                    ? theme === "Dark"
                                                        ? "bg-blue-700 text-white ring-2 ring-blue-400"
                                                        : "bg-blue-600 text-white ring-2 ring-blue-300"
                                                    : theme === "Dark"
                                                        ? "bg-gray-800 text-white hover:bg-blue-800"
                                                        : "bg-white text-gray-800 hover:bg-blue-200"
                                                }
  `}
                                        >
                                            <p className="font-semibold text-sm">{employee.Name}</p>
                                        </button>

                                    )) : (
                                        <div className="flex items-center justify-center opacity-50 w-full">
                                            <FaUsers className={`text-3xl mr-2 ${theme === "Dark" ? "text-white" : "text-black"}`} />
                                            <p className="text-sm">No Employee Added</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>

                        {/* Lower Half: Receipt Names Section */}
                        <div className="p-6 flex flex-col h-screen">
                            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                                <h3 className="text-sm sm:text-lg font-bold">Receipt Names</h3>

                                <div className="flex items-center gap-2">
                                    {dateFilterApplied && (
                                        <button
                                            onClick={clearDateFilter}
                                            className={`text-xs px-2 py-1 rounded-lg underline ${theme === "Dark" ? "text-blue-300" : "text-blue-700"
                                                }`}
                                        >
                                            Clear
                                        </button>
                                    )}
                                    <button
                                        onClick={DateModalFunBtn}
                                        className={`py-1.5 px-3 rounded-lg text-xs
    ${theme === "Dark"
                                                ? "bg-blue-800 text-white hover:bg-blue-600"
                                                : "bg-blue-600 text-white hover:bg-blue-800"
                                            }`}
                                    >
                                        Choose Date / Time
                                    </button>
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3 overflow-y-auto pr-2">
                                {filteredTickets ? [...filteredTickets]
                                    .sort((a, b) => b.Date - a.Date)
                                    .map((t, index) => (
                                        <button
                                            key={index}
                                            style={{ borderRadius: 5 }}
                                            onClick={() => handleTicketClick(t)}
                                            className={`flex flex-row justify-between items-center p-2 rounded shadow-sm
                  ${theme === "Dark" ? "border border-blue-800" : "bg-white hover:bg-blue-200"}`}
                                        >
                                            <p className="text-xs sm:text-sm text-left">
                                                {t.CashSale} <br />
                                                <span className=" opacity-60">{new Date(t.Date).toLocaleString("en-GB")}</span>
                                            </p>
                                            <div
                                                onClick={(e) => { e.stopPropagation(); handleTicketClick(t); setReceiptModal(true); }}
                                                className={`py-1 px-3 rounded text-xs 
                    ${theme === "Dark" ? "text-white bg-blue-800 hover:bg-blue-600" : "bg-blue-600 text-white hover:bg-blue-800"}`}
                                            >
                                                Receipt
                                            </div>
                                        </button>
                                    )) : (
                                    <div className="flex flex-col items-center justify-center py-16 w-full overflow-hidden animate-in fade-in duration-1000">

                                        {/* --- Animation Container --- */}
                                        <div className="relative mb-10">

                                            {/* Soft Background Pulse (The System Rhythm) */}
                                            <div className={`absolute inset-0 scale-150 blur-[50px] rounded-full opacity-20 animate-[pulse_4s_ease-in-out_infinite]
            ${theme === "Dark" ? "bg-blue-400" : "bg-blue-600"}`}></div>

                                            {/* Main Icon - "Paper Feed" vertical jitter animation */}
                                            <div className="relative   animate-[receiptFloat_3s_ease-in-out_infinite] group">
                                                <FaReceipt
                                                    className={`text-6xl transition-transform duration-500 group-hover:scale-110 
                ${theme === "Dark" ? "text-white/90" : "text-blue-700"}`}
                                                />

                                                {/* Minimalist Accent - Corner Sparkle */}
                                                <div className="absolute -top-1 -right-1 animate-pulse">
                                                    <div className={`w-3 h-3 rotate-45 ${theme === "Dark" ? "bg-blue-300" : "bg-blue-500"}`}></div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* --- Text Section --- */}
                                        <div className="text-center px-6">

                                            {/* EXACT Wording from your prompt */}
                                            <h1 className={`text-xl sm:text-2xl font-black tracking-tight opacity-0 animate-[fadeInSlide_0.8s_ease-out_forwards]
            ${theme === "Dark" ? "text-white" : "text-gray-900"}`}>
                                                {dateFilterApplied ? "No Receipts in this Range" : "Select Employee / No Receipts"}
                                            </h1>

                                            {/* Animated Underline Divider */}
                                            <div className={`h-[3px] w-0 mx-auto my-4 bg-blue-500 animate-[growLine_1s_ease-in-out_0.5s_forwards]`}></div>

                                            {/* High-End Subtext */}
                                            <p className={`text-[10px] uppercase tracking-[0.3em] font-bold opacity-0 animate-[fadeInSlide_0.8s_ease-out_0.8s_forwards]
            ${theme === "Dark" ? "text-gray-500" : "text-gray-400"}`}>
                                                Transaction records are currently unavailable
                                            </p>
                                        </div>

                                        {/* --- Custom Rhythm Keyframes --- */}
                                        <style jsx>{`
        @keyframes receiptFloat {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-12px); }
        }
        @keyframes fadeInSlide {
            from { opacity: 0; transform: translateY(10px); filter: blur(5px); }
            to { opacity: 1; transform: translateY(0); filter: blur(0); }
        }
        @keyframes growLine {
            from { width: 0; }
            to { width: 60px; }
        }
    `}</style>
                                    </div>
                                )}
                            </div>
                        </div>
                    </aside>

                    {/* RIGHT COLUMN: Items Section */}
                    <section className="w-full   p-6 h-screen flex flex-col overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-md sm:text-lg font-bold">Items Breakdown</h3>
                            <div className={`font-bold text-md sm:text-lg 
                             ${theme === "Dark" ? "text-white" : "text-black"}`}
                            >
                                Total: Ksh {displayGrandTotal.toFixed(2)}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <table className="min-w-full table-auto shadow-lg rounded overflow-hidden">
                                <thead className={`sticky top-0 ${theme === "Dark" ? "bg-blue-800" : "bg-blue-600 text-white"}`}>
                                    <tr>
                                        <th className={`border py-2 text-xs sm:text-md ${theme === "Dark" ? "border-blue-900" : "border-gray-300"}`}>#</th>
                                        <th className={`border py-2 text-xs sm:text-md ${theme === "Dark" ? "border-blue-900" : "border-gray-300"}`}>Item</th>
                                        <th className={`border py-2 text-xs sm:text-md ${theme === "Dark" ? "border-blue-900" : "border-gray-300"}`}>Unit</th>
                                        <th className={`border py-2 text-xs sm:text-md ${theme === "Dark" ? "border-blue-900" : "border-gray-300"}`}>Price</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {cart && cart
                                        .filter((item) => item.Name.toLowerCase().includes(searchQuery.toLowerCase()))
                                        .map((item, index) => (
                                            <tr key={item.id} className={`text-xs sm:text-sm ${theme === "Dark" ? "hover:bg-blue-900/40" : "bg-white border border-gray-300 hover:bg-blue-100"}`}>
                                                <td className={`px-4 py-2 text-center border ${theme === "Dark" ? "border-blue-800" : "border-gray-300"}`}>{index + 1}</td>
                                                <td className={`px-4 py-2 text-center border ${theme === "Dark" ? "border-blue-800" : "border-gray-300"}`}>{item.Name}</td>
                                                <td className={`px-4 py-2 text-center border ${theme === "Dark" ? "border-blue-800" : "border-gray-300"}`}>{item.stock}</td>
                                                <td className={`px-4 py-2 text-center border ${theme === "Dark" ? "border-blue-800" : "border-gray-300"}`}>{item.Price}</td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </section>
                </div>
            )}

            {/* Date / Time Filter Modal */}
            {dateModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
                    <div className={` p-6 rounded-xl shadow w-96  mx-4
                        ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white "
                        }`
                    }>

                        <h2 className="text-md sm:text-xl font-bold text-center mb-4">Filter Receipts</h2>

                        <div className="flex justify-between mb-4 border-b">
                            <button
                                onClick={() => setActiveTab("day")}
                                className={`py-2 px-4 text-sm sm:text-base ${activeTab === "day" ? "border-b-2 border-blue-500 text-blue-500 font-bold" : "text-gray-500"}`}
                            >
                                Day
                            </button>
                            <button
                                onClick={() => setActiveTab("week")}
                                className={`py-2 px-4  text-sm sm:text-base ${activeTab === "week" ? "border-b-2 border-blue-500 text-blue-500 font-bold" : "text-gray-500"}`}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => setActiveTab("month")}
                                className={`py-2 px-4  text-sm sm:text-base ${activeTab === "month" ? "border-b-2 border-blue-500 text-blue-500 font-bold" : "text-gray-500"}`}
                            >
                                Month
                            </button>
                            <button
                                onClick={() => setActiveTab("year")}
                                className={`py-2 px-4  text-sm sm:text-base ${activeTab === "year" ? "border-b-2 border-blue-500 text-blue-500 font-bold" : "text-gray-500"}`}
                            >
                                Year
                            </button>
                        </div>

                        {activeTab === "day" && (
                            <div className="mb-4">
                                <label className={`block  text-xs sm:text-sm font-medium mb-2   
                                 ${theme === "Dark "
                                        ? "text-white"
                                        : " text-black  "
                                    }`}
                                >Select a Day</label>
                                <input
                                    type="date"
                                    value={filterDay}
                                    onChange={(e) => setFilterDay(e.target.value)}
                                    className="w-full px-4 py-2 border rounded focus:ring-2   focus:outline-none text-black text-sm sm:text-base "
                                />
                            </div>
                        )}

                        {activeTab === "week" && (
                            <div className="mb-4">
                                <label className={`block text-xs sm:text-sm font-medium  mb-2
                                   ${theme === "Dark"
                                        ? "text-white"
                                        : " text-black  "
                                    }`}
                                >Select a Week</label>
                                <input
                                    type="week"
                                    value={filterWeek}
                                    onChange={(e) => setFilterWeek(e.target.value)}
                                    className="w-full px-4 py-2 border rounded focus:ring-2   focus:outline-none text-black"
                                />
                            </div>
                        )}

                        {activeTab === "month" && (
                            <div className="mb-4">
                                <label className={`block text-xs sm:text-sm font-medium  mb-2
                                   ${theme === "Dark"
                                        ? "text-white"
                                        : " text-black  "
                                    }`}
                                >Select a Month</label>
                                <input
                                    type="month"
                                    value={filterMonth}
                                    onChange={(e) => setFilterMonth(e.target.value)}
                                    className="w-full px-4 py-2 border rounded focus:ring-2   focus:outline-none text-black"
                                />
                            </div>
                        )}

                        {activeTab === "year" && (
                            <div className="mb-4">
                                <label className={`block text-xs sm:text-sm font-medium text-gray-700 mb-2
                                   ${theme === "Dark"
                                        ? "text-white"
                                        : " text-black  "
                                    }`}
                                >Select a Year</label>
                                <select
                                    value={filterYear}
                                    onChange={(e) => setFilterYear(e.target.value)}
                                    className="w-full px-4 py-2 border rounded focus:ring-2   focus:outline-none text-black"
                                >
                                    {Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i).map((year) => (
                                        <option key={year} value={year}>
                                            {year}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <div className="flex justify-around mt-3">
                            <button
                                onClick={applyDateFilter}
                                className={` text-white px-4 py-2 rounded  mt-4  text-xs sm:text-base
                                
                              ${theme === "Dark"
                                        ? "bg-green-800  hover:bg-green-600"
                                        : "bg-green-600  hover:bg-green-800 "
                                    }`}
                            >
                                Apply Filter
                            </button>
                            <button
                                onClick={DateModalFun}
                                className={` text-white px-4 py-2 rounded mt-4 text-xs sm:text-base
                                  ${theme === "Dark"
                                        ? "bg-red-800  hover:bg-red-600"
                                        : "bg-red-600  hover:bg-red-800 "
                                    }`}
                            >
                                Cancel
                            </button>

                        </div>
                    </div>
                </div>
            )}


            {/*receipt Modal */}
            {receiptModal1 && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className="bg-white p-6 rounded shadow w-96" >
                        <h2 className="text-lg font-bold mb-4">Print Receipt</h2>

                        {cart.map((item, index) => (
                            <div
                                key={index}
                                className=" flex justify-between items-center p-2 bg-white shadow rounded mb-2 text-sm mt-3"
                            >
                                <div className="w-1/10 text-center">{item.stock}</div>
                                <div className="w-2/5 text-center">{item.Name}</div>
                                <div className="w-1/5 text-center">Ksh {item.Price}</div>

                            </div>
                        ))}


                        <div className="mt-4 font-bold text-lg">
                            Total: Ksh {total.toFixed(2)}

                        </div>

                        <div className=" flex flex-row justify-evenly">
                            <button
                                className={` text-white px-4 py-2 rounded  mt-4 
                                
                              ${theme === "Dark"
                                        ? "bg-green-800  hover:bg-green-600"
                                        : "bg-green-600  hover:bg-green-800 "
                                    }`}
                                onClick={() => window.print()}
                            >
                                print
                            </button>
                            <button
                                className={` text-white px-4 py-2 rounded mt-4
                                  ${theme === "Dark"
                                        ? "bg-red-800  hover:bg-red-600"
                                        : "bg-red-600  hover:bg-red-800 "
                                    }`}
                                onClick={receiptModalFun}
                            >
                                Cancel
                            </button>

                        </div>
                    </div>
                </div>
            )}


            {receiptModal && (
                <div className="w-full flex items-center justify-center bg-black bg-opacity-10 overflow-y-auto">

                    <div
                        className={`p-4  shadow w-[380px] font-sans text-sm  print-area receipt-container
                 ${theme === "Dark" ? "bg-white text-black" : "bg-white text-black"}
               `}
                    >
                        <div className="text-center ">
                            <p className=" font-bold text-xl font-extrabold tracking-tight uppercase font-sans">
                                {bizName}
                            </p>
                            <p className="font-semibold text-sm">Email : {bizEmail}</p>
                            <p className="font-semibold text-md">TEL : {bizPhone} </p>
                            {/**
                        *  <p className="font-semibold text-xs">VAT #: A002691181T | PIN  #: A002691181T</p>
                        */}

                        </div>

                        {/* Paybill Section with background 
                      <div className="print-bg bg-black text-white text-4xl py-1 text-center font-bold">
                       PAYBILL: 157424
                     </div>
                     */}


                        <div className="border-t border-dotted border-black/20 mt-1"></div>

                        {/* Cash Sale Header */}

                        <div className="text-center font-bold text-lg mb-2">CASH SALE</div>
                        <div className="border-t border-dotted border-black/20"></div>

                        {/* ✅ PAID INDICATOR */}
                        <div className="text-center my-2">
                            <span className="inline-block border-2 border-green-600 text-green-600 font-extrabold text-sm sm:text-base uppercase tracking-widest px-4 py-1 rotate-[-3deg]">
                                PAID
                            </span>
                        </div>

                        <div className="flex justify-between mb-2 font-bold">
                            <div>
                                {/**<p className="text-sm  ">Till No: {selectedTill}</p>
                          * 
                          *   <p className="text-sm ">PIN:</p>
                          */}
                                <p className="text-sm ">M/S: {selectedCashier}</p>
                                {customerName && (
                                    <p className="text-sm">Customer: {customerName}</p>
                                )}

                            </div>
                            <div>
                                <p className="text-sm">Cash Sale #: {receiptNumber}</p>
                            </div>

                        </div>


                        <div className="flex justify-between mb-2">
                            <p className="text-sm">Date: {selectedDate}</p>
                            <p className="text-sm ">Time:<span className="text-sm mx-2"> {selectedTime}</span></p>
                        </div>
                        <div className="border-t border-dotted border-black/20"></div>
                        <div >
                            <div className="flex justify-between font-bold text-sm">
                                <div className="w-1/2">ITEM</div>
                                <div className="grid grid-cols-2 gap-4 w-40 text-right">
                                    <span>PRICE</span>
                                    <span>AMOUNT</span>
                                </div>
                            </div>
                            <div className="border-t border-dotted border-black/20"></div>

                            <div className="bg-white text-black">
                                {cart.map((item, i) => (
                                    <div key={i} className="py-1">
                                        <div className="flex justify-between font-bold">
                                            <div className="font-sm">{item.Name}</div>
                                            <div className="text-xs">A</div>
                                        </div>
                                        <div className="flex justify-between">
                                            <div className="text-xs" >

                                                <span className="ml-8 text-sm ">
                                                    Qty : {parseFloat(item.stock).toFixed(0)}
                                                </span>
                                            </div>
                                            <div >
                                                <div className="grid grid-cols-2 gap-4 w-40 text-right">

                                                    <span>{item.Price.toLocaleString()}</span>
                                                    <span>{(parseInt(item.stock) * parseInt(item.Price)).toLocaleString()}</span>

                                                </div>
                                            </div>
                                        </div>
                                        <div className="border-t border-dotted border-black/20"></div>
                                    </div>

                                ))}
                            </div>


                            <div className="border-t border-dotted border-black/20"></div>


                            <div className=" my-2" />
                            <div className="flex justify-between font-bold text-sm">
                                <span>SUBTOTAL:</span>
                                <span>{format(total)}</span>
                            </div>

                            {deliveryFee > 0 && (
                                <div className="flex justify-between font-bold text-sm">
                                    <span>DELIVERY FEE:</span>
                                    <span>{format(deliveryFee)}</span>
                                </div>
                            )}

                            <div className="border-t border-dotted border-black/20"></div>
                            <div className="flex justify-between font-bold text-lg">
                                <span>TOTAL:</span>
                                <span>{format(displayGrandTotal)}</span>
                            </div>
                            <div className="border-t border-dotted border-black/20"></div>

                            {/* Payment methods breakdown */}
                            <div className="text-xs font-bold mt-2 uppercase">
                                Payment Method{payments.length > 1 ? "s" : ""} ({paymentType})
                            </div>
                            {payments.map((p, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span>{(p.method || "Cash").toString().toUpperCase()}</span>
                                    <span>{format(p.amount)}</span>
                                </div>
                            ))}

                            <div className="border-t border-dotted border-black/20"></div>
                            <div className="flex justify-between font-bold text-lg">
                                <span>AMOUNT PAID:</span>
                                <span>{format(amountPaidState)}</span>
                            </div>

                            {balanceState > 0 && (
                                <div className="flex justify-between font-bold text-lg text-red-600">
                                    <span>BALANCE:</span>
                                    <span>{format(balanceState)}</span>
                                </div>
                            )}

                            {changeState > 0 && (
                                <div className="flex justify-between font-bold text-lg">
                                    <span>CHANGE:</span>
                                    <span>{format(changeState)}</span>
                                </div>
                            )}
                        </div>
                        <div className="border-t border-dotted border-black/20"></div>

                        {/* Footer Summary */}
                        <div className="text-xs space-y-1">
                            <p className="flex items-center font-bold">
                                <strong className="flex-1">TOTAL ITEMS:</strong>
                                <span className="text-center w-40 mr-7">{totalItems}</span>
                            </p>
                            <div className="border-t border-dotted border-black/20"></div>
                            <p className="flex items-center font-bold">
                                <strong className="flex-1">TOTAL QTY:</strong>
                                <span className="text-center w-40 mr-7">{totalQty}</span>
                            </p>
                            <div className="border-t border-dotted border-black/20"></div>
                            <div className="border-t border-dotted border-black/20"></div>
                            <div className="border-t border-dotted border-black/20"></div>

                            {/* VAT Breakdown */}
                            <div className="mt-2">
                                <div className="grid grid-cols-4 text-xs mr-6">
                                    <p className="col-span-1 underline text-left"><strong>CODE</strong></p>
                                    <p className="col-span-1 underline text-right"><strong>VATABLE AMT</strong></p>
                                    <p className="col-span-1 underline text-right"><strong>VAT AMT</strong></p>
                                    <p className="col-span-1 underline text-right"><strong>TOTAL</strong></p>

                                    {['A', 'E', 'Z'].map(code => (
                                        <React.Fragment key={code}>
                                            <p className="col-span-1 text-left font-bold">{code}</p>
                                            <p className="col-span-1 text-right font-bold">{format(vatBreakdown[code].vatable - vatBreakdown[code].vat)}</p>
                                            <p className="col-span-1 text-right font-bold">{format(vatBreakdown[code].vat)}</p>
                                            <p className="col-span-1 text-right font-bold">
                                                {format(vatBreakdown[code].vatable)}
                                            </p>
                                        </React.Fragment>
                                    ))}
                                </div>
                            </div>

                            <div className="border-t border-dotted border-black/20"></div>
                            <p className="mt-2 font-semibold">VAT CODE:(A)=VATABLE, (E)=EXEMPT, (Z)=ZERO RATED</p>
                            <p className="font-semibold">PRICES INCLUSIVE OF VAT WHERE APPLICABLE</p>
                            <div className="border-t border-dotted border-black/20"></div>
                            <div className="border-t border-dotted border-black/20"></div>
                            <p className="font-bold">YOU WERE SERVED BY : {selectedCashier}</p>
                            <div className="border-t border-dotted border-black/20"></div>
                            <div className="border-t border-dotted border-black/20"></div>
                            <div className="text-xm text-center font-bold">
                                <p>GOODS ONCE SOLD CANNOT BE ACCEPTED</p>
                                <p>BACK FOR REFUND OR ANY OTHER REASON</p>
                            </div>
                            <div className="border-t border-dotted border-black/20"></div>
                            <div className="border-t border-dotted border-black/20"></div>
                            <div className="border-t border-dotted border-black/20"></div>

                            {/* QR Code Placeholder */}
                            <div className="flex justify-center my-3">
                                <QRCodeSVG
                                    value={JSON.stringify({
                                        invoice: '011039102000356913',
                                        totalItems: totalItems,
                                        totalQty: totalQty,
                                        totalWeight: totalWeight.toFixed(2),
                                        totalVAT: vatBreakdown.A.vat.toFixed(2),
                                        totalAmount: (vatBreakdown.A.vatable + vatBreakdown.A.vat).toFixed(2),
                                    })}
                                    size={96}
                                    bgColor="#ffffff"
                                    fgColor="#000000"
                                    level="H"
                                    className="border border-gray-400"
                                />
                            </div>



                            <div className="border-t border-black mb-2"></div>

                        </div>


                        <div className="text-xs text-center font-semibold">
                            <p >Thank You......Come Again.</p>
                        </div>

                        <div className=" no-print flex flex-row justify-evenly mt-4">
                            <button
                                className={`text-white px-4 py-2 rounded 
                     ${theme === "Dark" ? "bg-green-800 hover:bg-green-600" : "bg-green-600 hover:bg-green-800"}`}
                                onClick={() => window.print()}
                            >
                                Print
                            </button>
                            <button
                                className={`text-white px-4 py-2 rounded 
                     ${theme === "Dark" ? "bg-red-800 hover:bg-red-600" : "bg-red-600 hover:bg-red-800"}`}
                                onClick={receiptModalFun}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}





            {/* send Modal */}
            {sendModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className={` p-6 rounded-xl shadow w-96 
                        ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white "
                        }`
                    }>
                        <h2 className="text-lg font-bold mb-4 text-center">Confirm Sell </h2>

                        <div className="mt-4 font-bold text-lg">
                            Total: Ksh{total.toFixed(2)}
                        </div>
                        <div className="mt-4">

                            <p className="font-semibold"> Select Employee</p>

                            <select
                                className="border p-2 rounded mt-1 text-black"
                                value={selectEmployee}
                                onChange={(e) => setSelectEmployee(e.target.value)}
                            >
                                <option value="" disabled className="font-light">
                                    -- Select the Cashier --
                                </option>
                                {employees &&
                                    employees.map((employee) => (
                                        <option key={employee.id} value={employee.Name}>
                                            {employee.Name}
                                        </option>
                                    ))}
                            </select>

                        </div>

                        <div className=" flex flex-row justify-evenly">
                            <button
                                className={` text-white px-4 py-2 rounded  mt-4 
                                
                              ${theme === "Dark"
                                        ? "bg-green-800  hover:bg-green-600"
                                        : "bg-green-600  hover:bg-green-800 "
                                    }`}
                                onClick={handleSend}
                            >
                                Send
                            </button>
                            <button
                                className={` text-white px-4 py-2 rounded mt-4
                                  ${theme === "Dark"
                                        ? "bg-red-800  hover:bg-red-600"
                                        : "bg-red-600  hover:bg-red-800 "
                                    }`}
                                onClick={sendModalFun}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Auto-Close Modals */}
            {sendModalSuccess && (
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
                        <p>The Debt was cleared</p>
                    </div>
                </div>
            )}

            {sendModalFail && (
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
                        <p>The Debt was not cleared</p>
                    </div>
                </div>
            )}

            {sendModalFailEmployee && (
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
                        <p>Did not choose an Employee</p>
                    </div>
                </div>
            )}

        </div>
    )
}

export default Ticket
