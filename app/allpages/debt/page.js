"use client"

import React, { useState, useEffect, useMemo } from "react";
import { ref, update, push, remove } from 'firebase/database';
import { db } from "../../../config";
import { useUserAccountName, useUserID, useUserEmail, useUserName, useUserPhone } from "@/app/componets/zustand/profile";
import { useUserEmployee } from "@/app/componets/zustand/employees";
import { useUserTicket, useUserTicketTotal } from "@/app/componets/zustand/ticket";
import { useUserTheme } from "@/app/componets/zustand/theme";
import { useUserCustomers } from "@/app/componets/zustand/customers";
import { FaExclamationCircle, FaReceipt, FaUsers } from "react-icons/fa";
import { TiTick } from "react-icons/ti";
import { TbXboxX } from "react-icons/tb";
import { QRCodeSVG } from 'qrcode.react';

const Debt = () => {

    // ====================== ZUSTAND ======================
    const Id = useUserID((state) => state.userID)
    const employees = useUserEmployee((state) => state.userEmployee)

    const bizName = useUserName((state) => state.userName)
    const userAccountName = useUserAccountName((state) => state.userAccountName)

    const bizEmail = useUserEmail((state) => state.userEmail)
    const bizPhone = useUserPhone((state) => state.userPhone)

    const ticket = useUserTicket((state) => state.userTicket)
    const ticketTotal = useUserTicketTotal((state) => state.userTicketTotal)
    const theme = useUserTheme((state) => state.userTheme)

    // ====================== CUSTOMERS (id -> name resolution) ======================
    const rawCustomers = useUserCustomers((state) => state.userCustomers)

    const customersArray = useMemo(() => {
        if (!rawCustomers) return [];
        if (Array.isArray(rawCustomers)) return rawCustomers;
        return Object.entries(rawCustomers).map(([id, value]) => ({ id, ...value }));
    }, [rawCustomers]);

    const customerNameById = useMemo(() => {
        const map = {};
        customersArray.forEach((c) => {
            map[c.id] = c.Name || "Unnamed Customer";
        });
        return map;
    }, [customersArray]);

    const resolveCustomerName = (customer) => {
        if (!customer) return "-";
        return customerNameById[customer] || customer;
    };

    // ====================== LIST / SELECTION STATE ======================
    const [filteredTickets, setFilteredTickets] = useState(null);
    const [cart, setCart] = useState([]);
    const [cart1, setCart1] = useState(null);

    const [selectedCashier, setSelectedCashier] = useState("");
    const [selectedEmployee, setSelectedEmployee] = useState(null);

    const [receiptNumber, setReceiptNumber] = useState("")
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedTime, setSelectedTime] = useState("");
    const [selectedCustomer, setSelectedCustomer] = useState("");

    const [deleteId, setDeleteId] = useState(null);

    // ====================== MONEY BREAKDOWN FOR SELECTED DEBT ======================
    const [deliveryFee, setDeliveryFee] = useState(0);
    const [grandTotalState, setGrandTotalState] = useState(0);
    const [payments, setPayments] = useState([]); // payments already made against this debt
    const [amountPaidState, setAmountPaidState] = useState(0);
    const [balanceState, setBalanceState] = useState(0);

    const [total, setTotal] = useState(0); // items subtotal for the selected debt
    const [searchQuery, setSearchQuery] = useState("");

    // ====================== MODALS ======================
    const [sendModal, setSendModal] = useState(false);
    const [receiptModal, setReceiptModal] = useState(false);

    const [sendModalSuccess, setSendModalSuccess] = useState(false);
    const [sendModalFail, setSendModalFail] = useState(false);
    const [sendModalFailEmployee, setSendModalFailEmployee] = useState(false);

    /* ===================== DATE / TIME FILTER (same pattern as receipts page) ===================== */
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
    const handleEmployeeClick = (employeeName) => {
        setSelectedEmployee(employeeName);
        setCart([]);
        setCart1(null);
        setDeleteId(null);
        setFilteredTickets(getFilteredList(employeeName, dateFilterApplied));
    };

    /* ===================== DEBT (TICKET) SELECTION ===================== */
    const calculateTotal = (cartArr) => {
        if (!cartArr || cartArr.length === 0) return 0;
        return cartArr.reduce((sum, item) => sum + (item.stock * item.Price), 0);
    };

    const handleTicketClick = (t) => {
        const cartItems = t.Cart || [];
        setCart(cartItems);
        setCart1(cartItems);
        setDeleteId(t.id);

        setSelectedCashier(t.EmployeeID || "");
        setReceiptNumber(t.CashSale || t.id);
        setSelectedCustomer(resolveCustomerName(t.Customer));

        const subtotal = Number(t.Total) || calculateTotal(cartItems);
        const delivery = Number(t.DeliveryFee) || 0;
        const grand = Number(t.GrandTotal) || (subtotal + delivery);
        const paidSoFar = Number(t.AmountPaid) || 0;
        const bal = t.Balance != null ? Number(t.Balance) : Math.max(grand - paidSoFar, 0);

        setDeliveryFee(delivery);
        setGrandTotalState(grand);
        setPayments(Array.isArray(t.Payments) ? t.Payments : []);
        setAmountPaidState(paidSoFar);
        setBalanceState(bal);

        const jsDate = new Date(t.Date);
        const day = String(jsDate.getDate()).padStart(2, "0");
        const month = String(jsDate.getMonth() + 1).padStart(2, "0");
        const year = jsDate.getFullYear();
        setSelectedDate(`${day}/${month}/${year}`);
        setSelectedTime(jsDate.toTimeString().split(" ")[0]);
    };

    useEffect(() => {
        setTotal(calculateTotal(cart));
    }, [cart]);

    /* ===================== CLEAR / PART-PAY DEBT ===================== */
    const [clearPaymentMode, setClearPaymentMode] = useState("Single");
    const [clearPaymentMethod, setClearPaymentMethod] = useState("");
    const [clearAmountPaying, setClearAmountPaying] = useState("");
    const [clearMultiPayments, setClearMultiPayments] = useState([{ method: "cash", amount: "" }]);
    const [paymentError, setPaymentError] = useState("");

    const sendFunction = () => {
        setClearPaymentMode("Single");
        setClearPaymentMethod("");
        setClearAmountPaying(balanceState > 0 ? balanceState.toFixed(2) : "");
        setClearMultiPayments([{ method: "cash", amount: "" }]);
        setPaymentError("");
        setSendModal(true);
    };

    const sendModalFun = () => {
        setSendModal(false);
        setPaymentError("");
    };

    const generateRandomHex = () => {
        return 'MRCS' + Math.floor(100000 + Math.random() * 900000);
    };

    // Profit = Σ (SellingPrice - BuyingPrice) × quantity, across every line in the cart
    const calculateOrderProfit = (cartItems) => {
        return cartItems.reduce((profit, product) => {
            const qty = Number(product.stock) || 0;
            const sellingPrice = parseFloat(product.Price) || 0;
            const buyingPrice = parseFloat(product.BuyingPrice) || 0;
            return profit + (sellingPrice - buyingPrice) * qty;
        }, 0);
    };

    const deleteTicket = (employee) => {
        if (!Id) return;

        if (ticketTotal === 1) {
            remove(ref(db, `web/pos/${Id}/ticket`)).then(() => {
                useUserTicket.setState({ userTicket: null });
                useUserTicketTotal.setState({ userTicketTotal: null });
                setFilteredTickets(null);
                setCart([]);
                setCart1(null);
                setDeleteId(null);
            }).catch((error) => {
                console.log("ticket was not deleted", error);
            });
        } else {
            remove(ref(db, `web/pos/${Id}/ticket/${deleteId}`)).then(() => {
                setCart([]);
                setCart1(null);
                setDeleteId(null);
                handleEmployeeClick(employee);
            }).catch((error) => {
                console.log("ticket was not deleted", error);
            });
        }
    };

    // Builds the list of payments being entered right now (validates as it goes)
    const handleClearDebt = () => {
        if (!Id) {
            sendModalFun();
            sendFailEmployee();
            return;
        }

        if (clearPaymentMode === "Single") {
            if (!clearPaymentMethod) {
                setPaymentError("Select a payment method.");
                return;
            }
            const amt = Number(clearAmountPaying) || 0;
            if (amt <= 0) {
                setPaymentError("Enter a valid amount.");
                return;
            }
            processClearDebt([{ method: clearPaymentMethod, amount: amt }]);
        } else {
            const cleaned = clearMultiPayments
                .filter((p) => p.method && Number(p.amount) > 0)
                .map((p) => ({ method: p.method, amount: Number(p.amount) }));

            if (cleaned.length === 0) {
                setPaymentError("Enter at least one valid split payment.");
                return;
            }
            processClearDebt(cleaned);
        }
    };

    // If the new payment(s) bring the balance to 0 (or below) -> debt is cleared:
    //   record it as a completed receipt in cart/ and delete the ticket, exactly like before.
    // Otherwise -> just update the ticket with the extra payment, nothing is deleted.
    const processClearDebt = (newPaymentsRecord) => {
        const paidNow = newPaymentsRecord.reduce((s, p) => s + p.amount, 0);
        const mergedPayments = [...payments, ...newPaymentsRecord];
        const newAmountPaid = amountPaidState + paidNow;
        const newBalance = Math.max(grandTotalState - newAmountPaid, 0);
        const change = Math.max(newAmountPaid - grandTotalState, 0);

        if (newBalance <= 0) {
            try {
                const hexTicket = generateRandomHex();
                const cartRef = ref(db, `web/pos/${Id}/cart/`);
                push(cartRef, {
                    EmployeeID: selectedCashier,
                    CashSale: hexTicket,
                    Cart: cart,
                    Customer: selectedCustomer,
                    Total: total,
                    DeliveryFee: deliveryFee,
                    GrandTotal: grandTotalState,
                    PaymentType: "Full",
                    PaymentMode: clearPaymentMode,
                    Payments: mergedPayments,
                    AmountPaid: newAmountPaid,
                    Balance: 0,
                    Change: change,
                    Profit: calculateOrderProfit(cart),
                    Date: Date.now(),
                });

                sendModalFun();
                sendSuccess();
                deleteTicket(selectedCashier);
            } catch (error) {
                console.log("did not clear debt", error);
                sendModalFun();
                sendFail();
            }
        } else {
            try {
                update(ref(db, `web/pos/${Id}/ticket/${deleteId}`), {
                    Payments: mergedPayments,
                    AmountPaid: newAmountPaid,
                    Balance: newBalance,
                });

                setPayments(mergedPayments);
                setAmountPaidState(newAmountPaid);
                setBalanceState(newBalance);

                sendModalFun();
                sendSuccess();
            } catch (error) {
                console.log("did not update debt", error);
                sendModalFun();
                sendFail();
            }
        }
    };

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
        const code = item.vatCode || 'A';
        const qty = parseInt(item.stock);
        const price = parseFloat(item.Price);
        const vatableAmount = price * qty;
        const vatAmount = code === 'A' ? vatableAmount * 0.16 : 0;

        if (vatBreakdown[code]) {
            vatBreakdown[code].vatable += vatableAmount;
            vatBreakdown[code].vat += vatAmount;
        }
    });

    const format = (val) => (Number(val) || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const displayGrandTotal = grandTotalState || (total + deliveryFee);

    // live preview for the Clear Debt modal
    const previewPaidNow = clearPaymentMode === "Single"
        ? (Number(clearAmountPaying) || 0)
        : clearMultiPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0);
    const previewNewBalance = Math.max(balanceState - previewPaidNow, 0);
    const previewChange = Math.max(previewPaidNow - balanceState, 0);


    return (

        <div className={`min-h-screen flex flex-col 
                  ${theme === "Dark"
                ? "text-white "
                : "bg-gray-200 text-black rounded-lg"
            }`}>

            {/* Main Layout */}
            {!receiptModal && (
                <div
                    className={`flex flex-col lg:flex-row flex-grow p-1 md:w-3/4 w-full mx-auto ${theme === "Dark" ? "text-white" : "bg-gray-100 text-black rounded-lg"
                        }`}
                >
                    {/* LEFT COLUMN: Employees + Debts */}
                    <aside className="border-r  sm:w-1/3 shadow-xl rounded-lg h-screen sm:h-screen flex flex-col overflow-hidden">

                        {/* EMPLOYEES SECTION */}
                        <div className="p-6 flex flex-col border-b">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm sm:text-lg font-bold">Employees</h3>
                            </div>

                            <div className="flex-1 overflow-x-auto py-2 px-2">
                                <div className="flex space-x-3">
                                    {employees && employees.length ? (
                                        employees.map((employee, index) => (
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
                                        ))
                                    ) : (
                                        <div className="flex items-center justify-center opacity-50 w-full py-6">
                                            <FaUsers className={`text-3xl mr-2 ${theme === "Dark" ? "text-white" : "text-black"}`} />
                                            <p className="text-sm">No Employee Added</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* DEBTS (RECEIPT NAMES) SECTION */}
                        <div className="p-6 flex flex-col flex-1 overflow-hidden">
                            <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
                                <h3 className="text-sm sm:text-lg font-bold">Debts</h3>

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
                                {filteredTickets && filteredTickets.length ? (
                                    [...filteredTickets]
                                        .sort((a, b) => b.Date - a.Date)
                                        .map((t, index) => {
                                            const bal = t.Balance != null
                                                ? Number(t.Balance)
                                                : Math.max((Number(t.GrandTotal) || Number(t.Total) || 0) - (Number(t.AmountPaid) || 0), 0);
                                            return (
                                                <button
                                                    key={t.id || index}
                                                    style={{ borderRadius: 5 }}
                                                    onClick={() => handleTicketClick(t)}
                                                    className={`flex flex-row justify-between items-center p-2 rounded shadow-sm ${theme === "Dark"
                                                        ? "border border-blue-800"
                                                        : "bg-white hover:bg-blue-200"
                                                        }`}
                                                >
                                                    <p className="text-xs sm:text-sm text-left">
                                                        {resolveCustomerName(t.Customer)} <br />
                                                        <span className="opacity-60">
                                                            {new Date(t.Date).toLocaleString("en-GB")}
                                                        </span> <br />
                                                        <span className="font-semibold text-orange-600">
                                                            Bal: Ksh {format(bal)}
                                                        </span>
                                                    </p>

                                                    <div
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleTicketClick(t);
                                                            setReceiptModal(true);
                                                        }}
                                                        className={`py-1 px-3 rounded text-xs ${theme === "Dark"
                                                            ? "text-white bg-blue-800 hover:bg-blue-600"
                                                            : "bg-blue-600 text-white hover:bg-blue-800"
                                                            }`}
                                                    >
                                                        Receipt
                                                    </div>
                                                </button>
                                            );
                                        })
                                ) : (
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
                    <section className="w-full p-6 h-screen flex flex-col overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-md sm:text-lg font-bold">Items Breakdown</h3>
                            <div
                                className={`font-bold text-md sm:text-lg ${theme === "Dark" ? "text-white" : "text-black"
                                    }`}
                            >
                                Total: Ksh {format(displayGrandTotal)}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto">
                            <table className="min-w-full table-auto shadow-lg rounded overflow-hidden">
                                <thead
                                    className={`sticky top-0 ${theme === "Dark" ? "bg-blue-800" : "bg-blue-600 text-white"
                                        }`}
                                >
                                    <tr>
                                        <th className={`border py-2 text-xs sm:text-md ${theme === "Dark" ? "border-blue-900" : "border-gray-300"}`}>#</th>
                                        <th className={`border py-2 text-xs sm:text-md ${theme === "Dark" ? "border-blue-900" : "border-gray-300"}`}>Item</th>
                                        <th className={`border py-2 text-xs sm:text-md ${theme === "Dark" ? "border-blue-900" : "border-gray-300"}`}>Unit</th>
                                        <th className={`border py-2 text-xs sm:text-md ${theme === "Dark" ? "border-blue-900" : "border-gray-300"}`}>Price</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {cart &&
                                        cart
                                            .filter((item) =>
                                                item.Name.toLowerCase().includes(searchQuery.toLowerCase())
                                            )
                                            .map((item, index) => (
                                                <tr
                                                    key={index}
                                                    className={`text-xs sm:text-sm ${theme === "Dark"
                                                        ? "hover:bg-blue-900/40"
                                                        : "bg-white border border-gray-300 hover:bg-blue-100"
                                                        }`}
                                                >
                                                    <td className={`px-4 py-2 text-center border ${theme === "Dark" ? "border-blue-800" : "border-gray-300"}`}>
                                                        {index + 1}
                                                    </td>
                                                    <td className={`px-4 py-2 text-center border ${theme === "Dark" ? "border-blue-800" : "border-gray-300"}`}>
                                                        {item.Name}
                                                    </td>
                                                    <td className={`px-4 py-2 text-center border ${theme === "Dark" ? "border-blue-800" : "border-gray-300"}`}>
                                                        {item.stock}
                                                    </td>
                                                    <td className={`px-4 py-2 text-center border ${theme === "Dark" ? "border-blue-800" : "border-gray-300"}`}>
                                                        {item.Price}
                                                    </td>
                                                </tr>
                                            ))}
                                </tbody>
                            </table>
                        </div>

                        {cart1 && (
                            <div className="flex flex-col sm:flex-row justify-between items-center mt-4 gap-3">
                                <div className="text-sm sm:text-base font-semibold text-orange-600">
                                    Balance Due: Ksh {format(balanceState)}
                                </div>
                                <button
                                    className={`py-2 px-7 rounded-lg text-xs sm:text-base ${theme === "Dark"
                                        ? "text-white bg-green-800 hover:bg-green-600"
                                        : "bg-green-600 text-white hover:bg-green-800 shadow-lg"
                                        }`}
                                    onClick={() => sendFunction()}
                                >
                                    Clear Debt
                                </button>
                            </div>
                        )}
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

                        <h2 className="text-md sm:text-xl font-bold text-center mb-4">Filter Debts</h2>

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

            {/* NOT PAID / PARTIAL receipt */}
            {receiptModal && (
                <div className="w-full flex items-center justify-center bg-black bg-opacity-10 overflow-y-auto">

                    <div
                        className={`p-4  shadow w-[380px] font-sans text-sm  print-area receipt-container bg-white text-black`}
                    >
                        <div className="text-center ">
                            <p className=" font-bold text-xl font-extrabold tracking-tight uppercase font-sans">
                                {bizName}
                            </p>
                            <p className="font-semibold text-sm">Email : {bizEmail}</p>
                            <p className="font-semibold text-md">TEL : {bizPhone} </p>
                        </div>

                        <div className="border-t border-dotted border-black/20 mt-1"></div>
                        <div className="text-center font-bold text-lg mb-2">CASH SALE</div>
                        <div className="border-t border-dotted border-black/20"></div>

                        {/* NOT PAID / PARTIALLY PAID stamp */}
                        <div className="text-center my-2">
                            <span
                                className={`inline-block border-2 font-extrabold text-sm sm:text-base uppercase tracking-widest px-4 py-1 rotate-[-3deg] ${amountPaidState > 0 ? "border-orange-600 text-orange-600" : "border-red-600 text-red-600"
                                    }`}
                            >
                                {amountPaidState > 0 ? "PARTIALLY PAID" : "NOT PAID"}
                            </span>
                        </div>

                        <div className="flex justify-between mb-2 font-bold">
                            <div>
                                <p className="text-sm ">M/S: {selectedCashier}</p>
                                {selectedCustomer && (
                                    <p className="text-sm">Customer: {selectedCustomer}</p>
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
                                                    <span>{Number(item.Price).toLocaleString()}</span>
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
                                <span>GRAND TOTAL:</span>
                                <span>{format(displayGrandTotal)}</span>
                            </div>
                            <div className="border-t border-dotted border-black/20"></div>

                            <div className="text-xs font-bold mt-2 uppercase">
                                Payments Received So Far
                            </div>
                            {payments.length ? payments.map((p, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span>{(p.method || "Cash").toString().toUpperCase()}</span>
                                    <span>{format(p.amount)}</span>
                                </div>
                            )) : (
                                <div className="text-sm italic">No payments recorded yet</div>
                            )}

                            <div className="border-t border-dotted border-black/20"></div>
                            <div className="flex justify-between font-bold text-lg">
                                <span>AMOUNT PAID:</span>
                                <span>{format(amountPaidState)}</span>
                            </div>
                            <div className="flex justify-between font-bold text-lg text-red-600">
                                <span>BALANCE DUE:</span>
                                <span>{format(balanceState)}</span>
                            </div>
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
                            <p className="font-bold">SERVED BY : {selectedCashier}</p>
                            <div className="border-t border-dotted border-black/20"></div>

                            <div className="flex justify-center my-3">
                                <QRCodeSVG
                                    value={JSON.stringify({
                                        invoice: receiptNumber,
                                        totalItems: totalItems,
                                        totalQty: totalQty,
                                        totalWeight: totalWeight.toFixed(2),
                                        amountPaid: amountPaidState.toFixed(2),
                                        balanceDue: balanceState.toFixed(2),
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
                            <p>Please clear the balance at your earliest convenience.</p>
                        </div>

                        <div className=" no-print flex flex-row justify-evenly mt-4">
                            <button
                                className="text-white px-4 py-2 rounded bg-green-600 hover:bg-green-800"
                                onClick={() => window.print()}
                            >
                                Print
                            </button>
                            <button
                                className="text-white px-4 py-2 rounded bg-red-600 hover:bg-red-800"
                                onClick={() => setReceiptModal(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Clear Debt modal */}
            {sendModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className={` p-6 rounded-xl shadow w-96  mx-4 max-h-[90vh] overflow-y-auto
                        ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white "
                        }`
                    }>
                        <h2 className="text-md sm:text-lg font-bold mb-4 text-center">Clear Debt</h2>

                        <div className="mt-2 p-3 rounded bg-gray-100 text-black text-xs sm:text-sm">
                            <div className="flex justify-between"><span>Grand Total</span><span>Ksh {format(grandTotalState)}</span></div>
                            <div className="flex justify-between"><span>Already Paid</span><span>Ksh {format(amountPaidState)}</span></div>
                            <div className="flex justify-between font-bold text-orange-600 border-t border-gray-300 mt-1 pt-1">
                                <span>Balance Due</span><span>Ksh {format(balanceState)}</span>
                            </div>
                        </div>

                        <div className="mt-4">
                            <label className="text-xs sm:text-sm font-medium text-gray-600">Pay Via</label>
                            <div className="flex gap-2 mt-2">
                                <button
                                    type="button"
                                    className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${clearPaymentMode === "Single" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                                        }`}
                                    onClick={() => { setClearPaymentMode("Single"); setPaymentError(""); }}
                                >
                                    One Method
                                </button>
                                <button
                                    type="button"
                                    className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${clearPaymentMode === "Split" ? "bg-blue-600 text-white" : "bg-gray-200 text-gray-700"
                                        }`}
                                    onClick={() => { setClearPaymentMode("Split"); setPaymentError(""); }}
                                >
                                    Split Methods
                                </button>
                            </div>

                            {clearPaymentMode === "Single" && (
                                <div className="mt-3">
                                    <select
                                        className={`w-full p-3 border rounded focus:outline-none focus:ring-2 shadow-md text-black text-xs sm:text-base ${paymentError ? "border-red-500 ring-red-300" : "border-gray-300 focus:ring-[#303133]"
                                            }`}
                                        value={clearPaymentMethod}
                                        onChange={(e) => { setClearPaymentMethod(e.target.value); setPaymentError(""); }}
                                    >
                                        <option value="" disabled>-- Select Payment Method --</option>
                                        <option value="cash">Cash</option>
                                        <option value="till">Till Number</option>
                                        <option value="paybill">Paybill</option>
                                        <option value="bank">Bank</option>
                                    </select>

                                    <div className="mt-3">
                                        <label className="text-xs sm:text-sm font-medium text-gray-600">Amount Paying Now</label>
                                        <input
                                            type="number"
                                            min="0"
                                            placeholder="Enter amount"
                                            className={`w-full p-3 border rounded focus:outline-none focus:ring-2 shadow-md text-black text-xs sm:text-base ${paymentError ? "border-red-500 ring-red-300" : "border-gray-300 focus:ring-[#303133]"
                                                }`}
                                            value={clearAmountPaying}
                                            onChange={(e) => { setClearAmountPaying(e.target.value); setPaymentError(""); }}
                                        />
                                    </div>
                                </div>
                            )}

                            {clearPaymentMode === "Split" && (
                                <div className="mt-3 border border-gray-300 rounded p-3">
                                    {clearMultiPayments.map((entry, index) => (
                                        <div key={index} className="flex gap-2 mt-2 items-center first:mt-0">
                                            <select
                                                className="flex-1 p-2 border border-gray-300 rounded text-black text-xs sm:text-sm"
                                                value={entry.method}
                                                onChange={(e) => {
                                                    const updated = [...clearMultiPayments];
                                                    updated[index].method = e.target.value;
                                                    setClearMultiPayments(updated);
                                                    setPaymentError("");
                                                }}
                                            >
                                                <option value="cash">Cash</option>
                                                <option value="till">Till</option>
                                                <option value="paybill">Paybill</option>
                                                <option value="bank">Bank</option>
                                            </select>

                                            <input
                                                type="number"
                                                min="0"
                                                placeholder="Amount"
                                                className="w-24 p-2 border border-gray-300 rounded text-black text-xs sm:text-sm"
                                                value={entry.amount}
                                                onChange={(e) => {
                                                    const updated = [...clearMultiPayments];
                                                    updated[index].amount = e.target.value;
                                                    setClearMultiPayments(updated);
                                                    setPaymentError("");
                                                }}
                                            />

                                            {clearMultiPayments.length > 1 && (
                                                <button
                                                    type="button"
                                                    className="text-red-500 text-xs font-bold px-2"
                                                    onClick={() => setClearMultiPayments(clearMultiPayments.filter((_, i) => i !== index))}
                                                >
                                                    ✕
                                                </button>
                                            )}
                                        </div>
                                    ))}

                                    <button
                                        type="button"
                                        className="text-xs sm:text-sm font-medium text-blue-600 mt-3"
                                        onClick={() => setClearMultiPayments([...clearMultiPayments, { method: "cash", amount: "" }])}
                                    >
                                        + Add Payment Mode
                                    </button>
                                </div>
                            )}

                            {paymentError && (
                                <p className="text-red-500 text-xs mt-3 font-medium">{paymentError}</p>
                            )}
                        </div>

                        {/* live preview */}
                        <div className="mt-4 p-3 rounded bg-gray-100 text-black text-xs sm:text-sm">
                            <div className="flex justify-between"><span>Paying Now</span><span>Ksh {format(previewPaidNow)}</span></div>
                            {previewNewBalance > 0 ? (
                                <div className="flex justify-between font-bold text-orange-600">
                                    <span>Remaining Balance</span><span>Ksh {format(previewNewBalance)}</span>
                                </div>
                            ) : (
                                <div className="flex justify-between font-bold text-green-600">
                                    <span>Status</span><span>Debt Fully Cleared</span>
                                </div>
                            )}
                            {previewChange > 0 && (
                                <div className="flex justify-between font-bold text-green-600">
                                    <span>Change</span><span>Ksh {format(previewChange)}</span>
                                </div>
                            )}
                        </div>

                        <div className=" flex flex-row justify-evenly">
                            <button
                                className={` text-white px-5 py-2 rounded  mt-4  text-xs sm:text-base
                              ${theme === "Dark"
                                        ? "bg-green-800  hover:bg-green-600"
                                        : "bg-green-600  hover:bg-green-800 "
                                    }`}
                                onClick={handleClearDebt}
                            >
                                Confirm
                            </button>
                            <button
                                className={` text-white px-4 py-2 rounded mt-4 text-xs sm:text-base
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
                        <p>The debt payment was recorded</p>
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
                        <p>The debt payment was not recorded</p>
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
                        <p>Could not identify this account</p>
                    </div>
                </div>
            )}

        </div>
    )
}

export default Debt
