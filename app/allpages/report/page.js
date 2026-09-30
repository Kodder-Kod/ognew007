"use client"

import { useState, useMemo } from "react";
import items from "@/app/data/items"
import { TbXboxX } from "react-icons/tb";
import { TiTick } from "react-icons/ti";
import { FaDollarSign, FaBox, FaTags, FaUsers } from 'react-icons/fa';
import {
    Line,
    Pie,
    Bar,
} from "react-chartjs-2";
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    BarElement,
} from "chart.js";
import { useUserCart } from "@/app/componets/zustand/cart";
import { useUserEmployee, useUserEmployeeTotal } from "@/app/componets/zustand/employees";
import { useUserAccountName, useUserID, useUserName } from "@/app/componets/zustand/profile";
import { useUserTheme } from "@/app/componets/zustand/theme";
import { useUserCategoriesTotal } from "@/app/componets/zustand/categories";
import { useUserItemsTotal } from "@/app/componets/zustand/items";

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    BarElement
);
import { FaCashRegister, FaShoppingCart, FaBoxOpen, FaChartLine } from "react-icons/fa";
import { FiCalendar, FiBarChart2, FiLock, FiTrendingUp } from "react-icons/fi";
import { MdOutlineInsights } from "react-icons/md";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { useUserLogs } from "@/app/componets/zustand/logs";


const Reports = () => {


    //// Sales labels

    const [totalProfit, setTotalProfit] = useState(null)      // NEW
    const [totalDelivery, setTotalDelivery] = useState(null)  // NEW

    //Zustand
    const employeeTotal = useUserEmployeeTotal((state) => state.userEmployeeTotal)
    const categoriesTotal = useUserCategoriesTotal((state) => state.userCategoriesTotal)
    const itemsTotal = useUserItemsTotal((state) => state.userItemsTotal)
    const cart = useUserCart((state) => state.userCart)
    const theme = useUserTheme((state) => state.userTheme)
    const userAccountName = useUserAccountName((state) => state.userAccountName)
    const bizName = useUserName((state) => state.userName)
    const logsData = useUserLogs((state) => state.userLogs);

    const logs = Object.values(logsData || {});
    const [filteredCart, setFilteredCart] = useState()


    const [filteredLogs, setFilteredLogs] = useState()

    //// Sales labels
    const [totalSales, setTotalSales] = useState(null)

    //// Auto Modals
    const [cartModal, setCartModal] = useState(false);
    const [timeModal, setTimeModal] = useState(false);

    const cartModalFun = () => {
        setCartModal(true);
        setTimeout(() => setCartModal(false), 1500);
    };

    const timeModalFun = () => {
        setTimeModal(true);
        setTimeout(() => setTimeModal(false), 1500);
    };

    /////Date modal 
    const [dateModal, setDateModal] = useState(false)

    const DateModalFun = () => {

        setDateModal(false)
    }
    const DateModalFunBtn = () => setDateModal(true)

    const [activeTab, setActiveTab] = useState("day");
    const [selectedDate, setSelectedDate] = useState("");
    const [selectedWeek, setSelectedWeek] = useState("");
    const [selectedMonth, setSelectedMonth] = useState("");
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

    // ===== DATE RANGE (NEW) =====
    const [selectedRangeStart, setSelectedRangeStart] = useState("");
    const [selectedRangeEnd, setSelectedRangeEnd] = useState("");

    // ===== APPLIED FILTER LABEL (NEW) =====
    const [appliedFilterLabel, setAppliedFilterLabel] = useState("No filter applied yet");


    // ===== TRANSACTIONS & AVERAGES =====
    const [transactionCount, setTransactionCount] = useState(0);
    const [averageSaleValue, setAverageSaleValue] = useState(0);
    const [employeeAvgSale, setEmployeeAvgSale] = useState({});
    const [employeeTransactions, setEmployeeTransactions] = useState({});

    // ===== SALES PER HOUR (SEPARATE GRAPH) =====
    const [dataSalesPerHour, setDataSalesPerHour] = useState({
        labels: Array.from({ length: 24 }, (_, i) =>
            i.toString().padStart(2, "0")
        ),
        datasets: [
            {
                label: "Sales per Hour",
                data: [],
                borderColor: "#8884d8",
                backgroundColor: "rgba(136, 132, 216, 0.5)",
            },
        ],
    });


    //// Initiate graphs 
    const [dataSalesOverTime, setDataSalesOverTime] = useState({
        labels: [],
        datasets: [
            {
                label: "Sales",
                data: [],
                borderColor: "#8884d8",
                backgroundColor: "rgba(136, 132, 216, 0.5)",
            },
        ],
    });

    const [dataPaymentOverTime, setDataPaymentOverTime] = useState({
        labels: [],
        datasets: [
            { label: "Cash", data: [], borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.3)" },
            { label: "Till", data: [], borderColor: "#22c55e", backgroundColor: "rgba(34,197,94,0.3)" },
            { label: "Paybill", data: [], borderColor: "#f59e0b", backgroundColor: "rgba(245,158,11,0.3)" },
            { label: "Bank", data: [], borderColor: "#a855f7", backgroundColor: "rgba(168,85,247,0.3)" },
        ],
    });



    const [dataEmployeeSales, setDataEmployeeSales] = useState({
        labels: [],
        datasets: [
            {
                label: "Sales",
                data: [],
                backgroundColor: ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"],
            },
        ],
    });
    const [itemSalesArray, setItemSalesArray] = useState([]);
    const [employeeItemSales, setEmployeeItemSales] = useState({}); // NEW: { employeeId: { itemName: { name, stock, totalSales } } }
    const [dataCategories, setDataCategories] = useState({
        labels: [],
        datasets: [
            {
                label: "Sales",
                data: [],
                backgroundColor: "#82ca9d",
            },
        ],
    });

    /// Cart filters 
    const filterByYear = (cart, selectedYear) => {
        const startOfYear = new Date(selectedYear, 0, 1).getTime();
        const endOfYear = new Date(selectedYear, 11, 31, 23, 59, 59, 999).getTime();

        return cart.filter((item) => item.Date >= startOfYear && item.Date <= endOfYear);
    };
    const filterByMonth = (cart, selectedYear, selectedMonth) => {
        // Convert to integer if it's a string, for proper date calculation
        selectedMonth = parseInt(selectedMonth.split("-")[1], 10); // Get the month part from YYYY-MM

        const startOfMonth = new Date(selectedYear, selectedMonth - 1, 1).getTime();
        const endOfMonth = new Date(selectedYear, selectedMonth, 0, 23, 59, 59, 999).getTime();
        return cart.filter((item) => item.Date >= startOfMonth && item.Date <= endOfMonth);
    };
    const filterByWeek = (cart, selectedDate) => {

        // Parse the week-based date (e.g., "2025-W03")
        const [year, week] = selectedDate.split("-W").map(Number);

        // Get the first day of the year
        const firstDayOfYear = new Date(Date.UTC(year, 0, 1));
        const dayOfWeek = firstDayOfYear.getUTCDay(); // Day of the week for Jan 1 (0=Sunday, 1=Monday, ...)

        // Calculate the ISO week start (Monday)
        const firstISOWeekStart = new Date(Date.UTC(year, 0, 1 + ((dayOfWeek <= 4 ? -dayOfWeek + 1 : 8 - dayOfWeek))));

        // Calculate the start and end of the selected week
        const startOfWeek = new Date(firstISOWeekStart.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000);
        const endOfWeek = new Date(startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000);

        startOfWeek.setUTCHours(0, 0, 0, 0);
        endOfWeek.setUTCHours(23, 59, 59, 999);

        // Filter the cart
        const filtered = cart.filter((item) => item.Date >= startOfWeek.getTime() && item.Date <= endOfWeek.getTime());
        return filtered;
    };
    const filterByDay = (cart, selectedDate) => {

        // Use UTC to avoid time zone issues
        const startOfDay = new Date(selectedDate).setUTCHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate).setUTCHours(23, 59, 59, 999);
        const filtered = cart.filter((item) => {
            const itemDate = Number(item.Date); // Ensure Date is a number
            return itemDate >= startOfDay && itemDate <= endOfDay;
        });
        return filtered;
    };

    // ===== DATE RANGE FILTER (NEW) =====
    const filterByRange = (cart, startDate, endDate) => {
        // Use UTC to avoid time zone issues, consistent with filterByDay
        const startOfRange = new Date(startDate).setUTCHours(0, 0, 0, 0);
        const endOfRange = new Date(endDate).setUTCHours(23, 59, 59, 999);
        const filtered = cart.filter((item) => {
            const itemDate = Number(item.Date);
            return itemDate >= startOfRange && itemDate <= endOfRange;
        });
        return filtered;
    };

    const calculateAnalytics = (cart) => {
        let salesOverYear = new Array(12).fill(0);
        let salesOverMonth = new Array(5).fill(0);
        let salesOverWeek = new Array(7).fill(0);
        let salesOverDay = new Array(24).fill(0);
        let salesOverRange = []; // NEW: sized once periodLength is known below

        let salesPerHour = new Array(24).fill(0);

        let employeeSales = {};
        let employeeTransactions = {};
        let employeeAvgSale = {};

        let itemSalesMap = {};
        let categorySales = {};
        let employeeItemSalesMap = {}; // NEW: per-employee item breakdown

        let transactionCount = 0;
        let totalSalesLocal = 0;
        let totalProfitLocal = 0;      // NEW
        let totalDeliveryLocal = 0;    // NEW
        let label = [];

        // NEW: all 4 payment methods tracked, not just Mpesa/Cash
        let paymentOverTime = {
            cash: [],
            till: [],
            paybill: [],
            bank: [],
        };

        // Number of days covered by the selected range (inclusive), min 1
        const rangeDayCount =
            selectedRangeStart && selectedRangeEnd
                ? Math.max(
                    1,
                    Math.floor(
                        (new Date(selectedRangeEnd).setUTCHours(0, 0, 0, 0) -
                            new Date(selectedRangeStart).setUTCHours(0, 0, 0, 0)) /
                        (1000 * 60 * 60 * 24)
                    ) + 1
                )
                : 1;

        // Initialize based on activeTab
        const periodLength =
            activeTab === "year" ? 12 :
                activeTab === "month" ? 5 :
                    activeTab === "week" ? 7 :
                        activeTab === "range" ? rangeDayCount :
                            24;

        if (activeTab === "range") {
            salesOverRange = new Array(periodLength).fill(0);
        }

        Object.keys(paymentOverTime).forEach((method) => {
            paymentOverTime[method] = new Array(periodLength).fill(0);
        });

        // Helper: number of whole days between an item's date and the range start
        const getRangeDayIndex = (itemDate) => {
            const start = new Date(selectedRangeStart);
            start.setUTCHours(0, 0, 0, 0);
            const current = new Date(itemDate);
            current.setUTCHours(0, 0, 0, 0);
            return Math.floor((current - start) / (1000 * 60 * 60 * 24));
        };

        cart.forEach((item) => {
            if (!item.Date || !item.EmployeeID || !item.Total || !item.Cart) return;

            const itemDate = new Date(item.Date);
            const itemMonth = itemDate.getMonth();
            const itemDay = itemDate.getDate();
            const itemDayOfWeek = itemDate.getDay();
            const itemHour = itemDate.getHours();

            transactionCount += 1;
            totalSalesLocal += item.Total;
            totalProfitLocal += Number(item.Profit) || 0;               // NEW
            totalDeliveryLocal += Number(item.DeliveryFee) || 0;         // NEW

            // ---- Payments breakdown: support new `Payments` array, fall back to legacy `Payment` string ----
            let payments = [];
            if (Array.isArray(item.Payments) && item.Payments.length > 0) {
                payments = item.Payments;
            } else if (item.Payment) {
                // legacy record saved before Payments array existed
                payments = [{ method: item.Payment, amount: item.Total }];
            }

            let index = 0;
            switch (activeTab) {
                case "year":
                    index = itemDate.getMonth();
                    break;
                case "month":
                    index = Math.floor((itemDate.getDate() - 1) / 7);
                    break;
                case "week":
                    index = itemDate.getDay();
                    break;
                case "day":
                    index = itemDate.getHours();
                    break;
                case "range": // NEW
                    index = getRangeDayIndex(item.Date);
                    break;
            }

            payments.forEach((p) => {
                let method = (p.method || "cash").toString().toLowerCase();
                if (method === "mpesa" || method === "m-pesa") method = "till"; // legacy mpesa records → till bucket
                if (!paymentOverTime[method]) method = "cash"; // unknown method → catch-all

                const amt = Number(p.amount) || 0;
                if (index >= 0 && index < paymentOverTime[method].length) {
                    paymentOverTime[method][index] += amt;
                }
            });

            // ===== SALES OVER TIME (ACTIVE TAB) =====
            switch (activeTab) {
                case "year":
                    label = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
                    salesOverYear[itemMonth] += item.Total;
                    break;

                case "month":
                    label = ["1", "2", "3", "4", "5"];
                    const weekIndex = Math.floor((itemDay - 1) / 7);
                    if (weekIndex < 5) salesOverMonth[weekIndex] += item.Total;
                    break;

                case "week":
                    label = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
                    salesOverWeek[itemDayOfWeek] += item.Total;
                    break;

                case "day":
                    label = Array.from({ length: 24 }, (_, i) =>
                        i.toString().padStart(2, "0")
                    );
                    salesOverDay[itemHour] += item.Total;
                    break;

                case "range": // NEW
                    label = Array.from({ length: periodLength }, (_, i) => {
                        const d = new Date(selectedRangeStart);
                        d.setDate(d.getDate() + i);
                        return d.toLocaleDateString();
                    });
                    const rangeIndex = getRangeDayIndex(item.Date);
                    if (rangeIndex >= 0 && rangeIndex < periodLength) {
                        salesOverRange[rangeIndex] += item.Total;
                    }
                    break;
            }

            // ===== SALES PER HOUR (INDEPENDENT) =====
            salesPerHour[itemHour] += item.Total;

            // ===== EMPLOYEE METRICS =====
            employeeSales[item.EmployeeID] =
                (employeeSales[item.EmployeeID] || 0) + item.Total;

            employeeTransactions[item.EmployeeID] =
                (employeeTransactions[item.EmployeeID] || 0) + 1;

            // ===== ITEMS & CATEGORIES =====
            item.Cart.forEach(product => {
                const productTotal = product.stock * parseFloat(product.Price);
                const productProfit =
                    product.stock * ((parseFloat(product.Price) || 0) - (parseFloat(product.BuyingPrice) || 0)); // NEW

                if (itemSalesMap[product.Name]) {
                    itemSalesMap[product.Name].stock += product.stock;
                    itemSalesMap[product.Name].totalSales += productTotal;
                    itemSalesMap[product.Name].totalProfit += productProfit; // NEW
                } else {
                    itemSalesMap[product.Name] = {
                        name: product.Name,
                        stock: product.stock,
                        totalSales: productTotal,
                        totalProfit: productProfit, // NEW
                    };
                }

                categorySales[product.Category] =
                    (categorySales[product.Category] || 0) + productTotal;

                // ===== EMPLOYEE ITEM SALES (NEW) =====
                if (!employeeItemSalesMap[item.EmployeeID]) {
                    employeeItemSalesMap[item.EmployeeID] = {};
                }
                const empItems = employeeItemSalesMap[item.EmployeeID];
                if (empItems[product.Name]) {
                    empItems[product.Name].stock += product.stock;
                    empItems[product.Name].totalSales += productTotal;
                } else {
                    empItems[product.Name] = {
                        name: product.Name,
                        stock: product.stock,
                        totalSales: productTotal,
                    };
                }
            });
        });

        // ===== AVERAGES =====
        Object.keys(employeeSales).forEach(emp => {
            employeeAvgSale[emp] =
                employeeSales[emp] / employeeTransactions[emp];
        });

        const averageSaleValue =
            transactionCount > 0 ? totalSalesLocal / transactionCount : 0;

        // ===== DATASETS =====
        return {
            dataSalesOverTime: {
                labels: label,
                datasets: [{
                    label: "Sales",
                    data:
                        activeTab === "day" ? salesOverDay :
                            activeTab === "week" ? salesOverWeek :
                                activeTab === "month" ? salesOverMonth :
                                    activeTab === "range" ? salesOverRange :
                                        salesOverYear,
                }],
            },

            dataSalesPerHour: {
                labels: Array.from({ length: 24 }, (_, i) =>
                    i.toString().padStart(2, "0")
                ),
                datasets: [{
                    label: "Sales per Hour",
                    data: salesPerHour,
                }],
            },

            dataEmployeeSales: {
                labels: Object.keys(employeeSales),
                datasets: [{
                    label: "Sales",
                    data: Object.values(employeeSales),
                }],
            },

            dataCategories: {
                labels: Object.keys(categorySales),
                datasets: [{
                    label: "Sales",
                    data: Object.values(categorySales),
                }],
            },

            dataPaymentOverTime: {
                labels:
                    activeTab === "year"
                        ? ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                        : activeTab === "month"
                            ? ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"]
                            : activeTab === "week"
                                ? ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                                : activeTab === "range"
                                    ? Array.from({ length: periodLength }, (_, i) => {
                                        const d = new Date(selectedRangeStart);
                                        d.setDate(d.getDate() + i);
                                        return d.toLocaleDateString();
                                    })
                                    : Array.from({ length: 24 }, (_, i) => i.toString().padStart(2, "0")),
                datasets: [
                    { label: "Cash", data: paymentOverTime.cash, borderColor: "#3b82f6", backgroundColor: "rgba(59,130,246,0.3)" },
                    { label: "Till", data: paymentOverTime.till, borderColor: "#22c55e", backgroundColor: "rgba(34,197,94,0.3)" },
                    { label: "Paybill", data: paymentOverTime.paybill, borderColor: "#f59e0b", backgroundColor: "rgba(245,158,11,0.3)" },
                    { label: "Bank", data: paymentOverTime.bank, borderColor: "#a855f7", backgroundColor: "rgba(168,85,247,0.3)" },
                ]
            },

            itemSales: Object.values(itemSalesMap),
            employeeItemSales: employeeItemSalesMap, // NEW

            transactionCount,
            averageSaleValue,
            employeeAvgSale,
            employeeTransactions,
            totalSalesLocal,
            totalProfitLocal,     // NEW
            totalDeliveryLocal,   // NEW
        };
    };

    // Build a human-readable label for whichever filter was just applied (NEW)
    const buildAppliedFilterLabel = () => {
        switch (activeTab) {
            case "day":
                return `Day: ${selectedDate}`;
            case "week":
                return `Week: ${selectedWeek}`;
            case "month":
                return `Month: ${selectedMonth}`;
            case "year":
                return `Year: ${selectedYear}`;
            case "range":
                return `Range: ${selectedRangeStart} → ${selectedRangeEnd}`;
            default:
                return "No filter applied yet";
        }
    };

    //// Report function control 
    const handleFilter = () => {

        if (cart) {

            // NEW: validate the range tab before doing anything else
            if (
                activeTab === "range" &&
                (!selectedRangeStart ||
                    !selectedRangeEnd ||
                    new Date(selectedRangeStart) > new Date(selectedRangeEnd))
            ) {
                setDateModal(false);
                timeModalFun();
                return;
            }

            const hasRangeSelection = selectedRangeStart && selectedRangeEnd; // NEW

            if (selectedDate || selectedMonth || selectedWeek || selectedYear || hasRangeSelection) {

                let filtered = [];
                switch (activeTab) {
                    case "day":
                        filtered = filterByDay(cart, selectedDate);
                        break;
                    case "week":
                        filtered = filterByWeek(cart, selectedWeek);
                        break;
                    case "month":
                        filtered = filterByMonth(cart, selectedYear, selectedMonth);
                        break;
                    case "year":
                        filtered = filterByYear(cart, selectedYear);
                        break;
                    case "range": // NEW
                        filtered = filterByRange(cart, selectedRangeStart, selectedRangeEnd);
                        break;
                    default:
                        console.log("Invalid filter type");
                        return;
                }
                if (filtered.length === 0) {
                    setDateModal(false)
                    setFilteredCart(null)
                    cartModalFun()
                    console.log("No filtered data available.");
                    return;
                }
                setFilteredCart(filtered);

                const analyticsData = calculateAnalytics(filtered);
                setDataSalesOverTime(analyticsData.dataSalesOverTime);
                setDataEmployeeSales(analyticsData.dataEmployeeSales);
                setItemSalesArray(analyticsData.itemSales);
                setEmployeeItemSales(analyticsData.employeeItemSales); // NEW
                setDataCategories(analyticsData.dataCategories);
                setDataPaymentOverTime(analyticsData.dataPaymentOverTime);

                setTransactionCount(analyticsData.transactionCount);
                setAverageSaleValue(analyticsData.averageSaleValue);
                setEmployeeAvgSale(analyticsData.employeeAvgSale);
                setEmployeeTransactions(analyticsData.employeeTransactions);
                setDataSalesPerHour(analyticsData.dataSalesPerHour);

                setTotalSales(analyticsData.totalSalesLocal);
                setTotalProfit(analyticsData.totalProfitLocal);       // NEW
                setTotalDelivery(analyticsData.totalDeliveryLocal);   // NEW

                setAppliedFilterLabel(buildAppliedFilterLabel()); // NEW

                setDateModal(false);
            } else {
                setDateModal(false);
                timeModalFun()
            }

        } else {
            setDateModal(false);
            cartModalFun()
        }
    };
    /// Overview stats 
    const reportData = [
        {
            label: 'Total Sales',
            value: `KES ${totalSales?.toLocaleString() || 0}`,
            icon: <FaCashRegister className={`text-3xl ${theme === "Dark" ? "text-white" : "text-blue-600"}`} />,
        },
        {
            label: 'Total Profit',   // NEW
            value: `KES ${totalProfit?.toLocaleString() || 0}`,
            icon: <FaChartLine className={`text-3xl ${theme === "Dark" ? "text-white" : "text-green-600"}`} />,
        },
        {
            label: 'Delivery Fees',  // NEW
            value: `KES ${totalDelivery?.toLocaleString() || 0}`,
            icon: <FaDollarSign className={`text-3xl ${theme === "Dark" ? "text-white" : "text-blue-600"}`} />,
        },
        {
            label: 'Transactions',
            value: transactionCount,
            icon: <FaShoppingCart className={`text-3xl ${theme === "Dark" ? "text-white" : "text-blue-600"}`} />,
        },
        {
            label: 'Average Sale',
            value: `KES ${averageSaleValue?.toFixed(2) || 0}`,
            icon: <FaChartLine className={`text-3xl ${theme === "Dark" ? "text-white" : "text-blue-600"}`} />,
        },
        {
            label: 'Employees',
            value: employeeTotal,
            icon: <FaUsers className={`text-3xl ${theme === "Dark" ? "text-white" : "text-blue-600"}`} />,
        },
    ];

    const [activeGraph, setActiveGraph] = useState("payment"); // "time" or "hour"
    const [activeView, setActiveView] = useState("pie"); // "pie" or "table"
    const [activeItemView, setActiveItemView] = useState("items"); // NEW: "items" or "employee"

    const [open, setOpen] = useState(false);
    const [openEmp, setOpenEmp] = useState(false);
    const [openCat, setOpenCat] = useState(false);
    const [openItem, setOpenItem] = useState(false);
    const [openLog, setOpenLog] = useState(false);

    const [sortConfig, setSortConfig] = useState({ key: null, direction: "asc" });

    // Sorting function
    const sortedItems = useMemo(() => {
        if (!sortConfig.key) return itemSalesArray;

        return [...itemSalesArray].sort((a, b) => {
            let aValue = a[sortConfig.key];
            let bValue = b[sortConfig.key];

            // Handle strings case-insensitively
            if (typeof aValue === "string") aValue = aValue.toLowerCase();
            if (typeof bValue === "string") bValue = bValue.toLowerCase();

            if (aValue < bValue) return sortConfig.direction === "asc" ? -1 : 1;
            if (aValue > bValue) return sortConfig.direction === "asc" ? 1 : -1;
            return 0;
        });
    }, [itemSalesArray, sortConfig]);

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const downloadXLSX = (sheetName, headers, rows, fileName, meta = []) => {
        const wsData = [
            ...meta,
            headers,
            ...rows
        ];

        const worksheet = XLSX.utils.aoa_to_sheet(wsData);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    const downloadPDF = (title, headers, rows, fileName, meta = []) => {
        const doc = new jsPDF();
        let y = 15;

        // 🔹 Styled Report Title
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(title, 14, y);

        // 🔹 Divider
        y += 5;
        doc.setLineWidth(0.5);
        doc.line(14, y, 196, y);

        // 🔹 Meta Details
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        meta.forEach((m) => {
            y += 6;
            doc.text(m, 14, y);
        });

        // 🔹 Table
        autoTable(doc, {
            startY: y + 6,
            head: [headers],
            body: rows,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 }
        });

        doc.save(`${fileName}.pdf`);
    };

    // XLSX Download for Sales
    const downloadSalesExcel = () => {
        // Ensure all possible datasets are present
        if (!dataSalesOverTime || !dataSalesPerHour || !dataPaymentOverTime) return;

        let headers = [];
        let rows = [];
        let reportTitle = "";
        let fileNameBase = "";

        const today = new Date();
        const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        const formattedTime = today.toLocaleTimeString();

        // inside downloadSalesExcel, replace the `if (activeGraph === "payment")` block:
        if (activeGraph === "payment") {
            reportTitle = `PAYMENT METHOD REPORT (${activeTab.toUpperCase()})`;
            fileNameBase = "payment_method_report";
            headers = ["Period", "Cash", "Till", "Paybill", "Bank", "Total Sales"];

            rows = dataPaymentOverTime.labels.map((label, i) => {
                const cash = dataPaymentOverTime.datasets[0].data[i] || 0;
                const till = dataPaymentOverTime.datasets[1].data[i] || 0;
                const paybill = dataPaymentOverTime.datasets[2].data[i] || 0;
                const bank = dataPaymentOverTime.datasets[3].data[i] || 0;
                return [
                    label,
                    cash,
                    till,
                    paybill,
                    bank,
                    cash + till + paybill + bank
                ];
            });
        }
        else {
            const isTime = activeGraph === "time";
            reportTitle = isTime ? "SALES OVER TIME REPORT" : "SALES PER HOUR REPORT";
            fileNameBase = isTime ? "sales_over_time" : "sales_per_hour";
            headers = ["Label", "Sales Amount"];

            const data = isTime ? dataSalesOverTime : dataSalesPerHour;
            rows = data.labels.map((label, i) => [
                label,
                data.datasets[0].data[i]
            ]);
        }

        // 2. Build Metadata Rows
        const meta = [
            [reportTitle],
            [`Business Name: ${bizName}`],
            [`Generated On: ${formattedDate} at ${formattedTime}`],
            [`Generated By: ${userAccountName}`],
            [`Filter Period: ${activeTab}`],
            [] // Empty row for spacing
        ];

        // 3. Create Workbook and Worksheet
        const wsData = [...meta, headers, ...rows];
        const worksheet = XLSX.utils.aoa_to_sheet(wsData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Sales Data");

        // 4. Trigger Download
        const fileName = `${fileNameBase}_${formattedDate.replace(/\//g, "-")}`;
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    // PDF Download for Sales
    const downloadSalesPDF = () => {
        // Check if the necessary data exists
        if (!dataSalesOverTime || !dataSalesPerHour || !dataPaymentOverTime) return;

        let headers = [];
        let rows = [];
        let title = "";
        let fileName = "";

        const today = new Date();
        const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        const formattedTime = today.toLocaleTimeString();

        // Determine data based on activeGraph
        // inside downloadSalesPDF, replace the `if (activeGraph === "payment")` block:
        if (activeGraph === "payment") {
            title = `PAYMENT METHOD REPORT (${activeTab.toUpperCase()})`;
            headers = ["Period", "Cash", "Till", "Paybill", "Bank", "Total"];

            rows = dataPaymentOverTime.labels.map((label, i) => {
                const cash = dataPaymentOverTime.datasets[0].data[i] || 0;
                const till = dataPaymentOverTime.datasets[1].data[i] || 0;
                const paybill = dataPaymentOverTime.datasets[2].data[i] || 0;
                const bank = dataPaymentOverTime.datasets[3].data[i] || 0;
                return [
                    label,
                    cash.toLocaleString(),
                    till.toLocaleString(),
                    paybill.toLocaleString(),
                    bank.toLocaleString(),
                    (cash + till + paybill + bank).toLocaleString()
                ];
            });
            fileName = `payment_method_${formattedDate.replace(/\//g, "-")}`;
        } else {
            // Original logic for Time and Hour
            const isTime = activeGraph === "time";
            const data = isTime ? dataSalesOverTime : dataSalesPerHour;

            headers = ["Label", "Sales"];
            rows = data.labels.map((label, i) => [
                label,
                data.datasets[0].data[i].toLocaleString()
            ]);

            title = `${isTime ? "SALES OVER TIME REPORT" : "SALES PER HOUR REPORT"} - ${formattedDate}`;
            fileName = `${isTime ? "sales_over_time" : "sales_per_hour"}_${formattedDate.replace(/\//g, "-")}`;
        }

        const meta = [
            `Business Name: ${bizName}`,
            `Generated On: ${formattedDate} at ${formattedTime}`,
            `Generated By: ${userAccountName}`,
            `Filter Mode: ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}`
        ];

        // Trigger the actual PDF generation utility
        downloadPDF(title, headers, rows, fileName, meta);
    };
    // Employee Downloads
    const downloadEmployeeExcel = () => {
        const today = new Date();
        const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        const formattedTime = today.toLocaleTimeString();

        const meta = [
            [`${activeView === "pie" ? "EMPLOYEE SALES REPORT" : "EMPLOYEE PERFORMANCE REPORT"} - ${formattedDate}`],
            [`Business Name: ${bizName}`],
            [`Generated On: ${formattedDate} at ${formattedTime}`],
            [`Generated By: ${userAccountName}`],
            []
        ];

        if (activeView === "pie") {
            const headers = ["Employee", "Sales"];
            const rows = dataEmployeeSales.labels.map((label, i) => [
                label,
                dataEmployeeSales.datasets[0].data[i]
            ]);

            const fileName = `employee_sales_${formattedDate.replace(/\//g, "-")}`;
            downloadXLSX("Employee Sales", headers, rows, fileName, meta);
        } else {
            const headers = ["Cashier", "Transactions", "Avg Sale (KES)"];
            const rows = Object.keys(employeeTransactions).map(emp => [
                emp,
                employeeTransactions[emp],
                employeeAvgSale[emp]?.toFixed(2)
            ]);

            const fileName = `employee_performance_${formattedDate.replace(/\//g, "-")}`;
            downloadXLSX("Performance", headers, rows, fileName, meta);
        }
    };

    const downloadEmployeePDF = () => {
        const isPie = activeView === "pie";

        const headers = isPie
            ? ["Employee", "Sales"]
            : ["Cashier", "Transactions", "Avg Sale (KES)"];

        const rows = isPie
            ? dataEmployeeSales.labels.map((l, i) => [
                l,
                dataEmployeeSales.datasets[0].data[i]
            ])
            : Object.keys(employeeTransactions).map(emp => [
                emp,
                employeeTransactions[emp],
                employeeAvgSale[emp]?.toFixed(2)
            ]);

        const today = new Date();
        const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        const formattedTime = today.toLocaleTimeString();

        const title = `${isPie ? "EMPLOYEE SALES REPORT" : "EMPLOYEE PERFORMANCE REPORT"} - ${formattedDate}`;
        const meta = [
            `Business Name: ${bizName}`,
            `Generated On: ${formattedDate} at ${formattedTime}`,
            `Generated By: ${userAccountName}`
        ];

        const fileName = `${isPie ? "employee_sales" : "employee_performance"}_${formattedDate.replace(/\//g, "-")}`;
        downloadPDF(title, headers, rows, fileName, meta);
    };

    // Categories Downloads
    const downloadCategoriesExcel = () => {
        const today = new Date();
        const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        const formattedTime = today.toLocaleTimeString();

        const headers = ["Category", "Sales"];
        const rows = dataCategories.labels.map((l, i) => [
            l,
            dataCategories.datasets[0].data[i]
        ]);

        const meta = [
            [`SALES BY CATEGORIES REPORT - ${formattedDate}`],
            [`Business Name: ${bizName}`],
            [`Generated On: ${formattedDate} at ${formattedTime}`], // ✅ fixed
            [`Generated By: ${userAccountName}`],                   // ✅ fixed
            []
        ];

        const wsData = [...meta, headers, ...rows];
        const worksheet = XLSX.utils.aoa_to_sheet(wsData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Categories");

        const fileName = `sales_by_categories_${formattedDate.replace(/\//g, "-")}`;
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    const downloadCategoriesPDF = () => {
        const today = new Date();
        const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        const formattedTime = today.toLocaleTimeString();

        const headers = ["Category", "Sales"];
        const rows = dataCategories.labels.map((l, i) => [
            l,
            dataCategories.datasets[0].data[i]
        ]);

        const title = `SALES BY CATEGORIES REPORT - ${formattedDate}`;
        const meta = [
            `Business Name: ${bizName}`,
            `Generated On: ${formattedDate} at ${formattedTime}`,
            `Generated By: ${userAccountName}`
        ];

        const fileName = `sales_by_categories_${formattedDate.replace(/\//g, "-")}`;
        downloadPDF(title, headers, rows, fileName, meta);
    };

    // Items Downloads
    const downloadItemsExcel = () => {
        const today = new Date();
        const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        const formattedTime = today.toLocaleTimeString();

        const headers = ["#", "Item", "Quantity", "Sales (KES)"];
        const rows = sortedItems.map((item, i) => [
            i + 1,
            item.name,
            item.stock,
            item.totalSales.toFixed(2)
        ]);

        // Add total row
        rows.push([]);
        rows.push(["", "", "TOTAL", totalSales.toFixed(2)]);

        const meta = [
            [`ITEMS SALES REPORT - ${formattedDate}`],
            [`Business Name: ${bizName}`],
            [`Generated On: ${formattedDate} at ${formattedTime}`],
            [`Generated By: ${userAccountName} `],
            []
        ];

        const wsData = [...meta, headers, ...rows];
        const worksheet = XLSX.utils.aoa_to_sheet(wsData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Items");

        const fileName = `items_sales_${formattedDate.replace(/\//g, "-")}`;
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    const downloadItemsPDF = () => {
        const today = new Date();
        const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        const formattedTime = today.toLocaleTimeString();

        const headers = ["#", "Item", "Quantity", "Sales (KES)"];
        const rows = sortedItems.map((item, i) => [
            i + 1,
            item.name,
            item.stock,
            item.totalSales.toFixed(2)
        ]);

        // Add total row
        rows.push(["", "", "TOTAL", totalSales.toFixed(2)]);

        const title = `ITEMS SALES REPORT - ${formattedDate}`;
        const meta = [
            `Business Name: ${bizName}`,
            `Generated On: ${formattedDate} at ${formattedTime}`,
            `Generated By: ${userAccountName}`
        ];

        const fileName = `items_sales_${formattedDate.replace(/\//g, "-")}`;
        downloadPDF(title, headers, rows, fileName, meta);
    };

    // Employee Items Downloads (NEW)
    const downloadEmployeeItemsExcel = () => {
        const today = new Date();
        const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        const formattedTime = today.toLocaleTimeString();

        const headers = ["Employee", "Item", "Quantity", "Sales (KES)"];
        const rows = [];
        Object.entries(employeeItemSales).forEach(([empId, items]) => {
            Object.values(items).forEach((item) => {
                rows.push([empId, item.name, item.stock, item.totalSales.toFixed(2)]);
            });
        });

        const meta = [
            [`EMPLOYEE ITEM SALES REPORT - ${formattedDate}`],
            [`Business Name: ${bizName}`],
            [`Generated On: ${formattedDate} at ${formattedTime}`],
            [`Generated By: ${userAccountName}`],
            []
        ];

        const wsData = [...meta, headers, ...rows];
        const worksheet = XLSX.utils.aoa_to_sheet(wsData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Employee Items");

        const fileName = `employee_items_sales_${formattedDate.replace(/\//g, "-")}`;
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    const downloadEmployeeItemsPDF = () => {
        const today = new Date();
        const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        const formattedTime = today.toLocaleTimeString();

        const headers = ["Employee", "Item", "Quantity", "Sales (KES)"];
        const rows = [];
        Object.entries(employeeItemSales).forEach(([empId, items]) => {
            Object.values(items).forEach((item) => {
                rows.push([empId, item.name, item.stock, item.totalSales.toFixed(2)]);
            });
        });

        const title = `EMPLOYEE ITEM SALES REPORT - ${formattedDate}`;
        const meta = [
            `Business Name: ${bizName}`,
            `Generated On: ${formattedDate} at ${formattedTime}`,
            `Generated By: ${userAccountName}`
        ];

        const fileName = `employee_items_sales_${formattedDate.replace(/\//g, "-")}`;
        downloadPDF(title, headers, rows, fileName, meta);
    };





    /* ===================== FILTER HANDLER ===================== */

    const handleLogsFilter = () => {
        console.log("logs", logs);

        // NEW: validate the range tab before doing anything else
        if (
            activeTab === "range" &&
            (!selectedRangeStart ||
                !selectedRangeEnd ||
                new Date(selectedRangeStart) > new Date(selectedRangeEnd))
        ) {
            setFilteredLogs(logs);
            return;
        }

        let filtered = [];

        switch (activeTab) {
            case "day":
                filtered = filterLogsByDay(logs, selectedDate);
                break;
            case "week":
                filtered = filterLogsByWeek(logs, selectedWeek);
                break;
            case "month":
                filtered = filterLogsByMonth(logs, selectedYear, selectedMonth);
                break;
            case "year":
                filtered = filterLogsByYear(logs, selectedYear);
                break;
            case "range": // NEW
                filtered = filterLogsByRange(logs, selectedRangeStart, selectedRangeEnd);
                break;
            default:
                filtered = logs;
        }

        setFilteredLogs(filtered);
        setDateModal(false);

        console.log("filtered logs", filtered);
    };

    /* ===================== DAY ===================== */

    const filterLogsByDay = (logs, selectedDate) => {
        const startOfDay = new Date(selectedDate).setHours(0, 0, 0, 0);
        const endOfDay = new Date(selectedDate).setHours(23, 59, 59, 999);

        return logs.filter(log =>
            log.timestamp >= startOfDay && log.timestamp <= endOfDay
        );
    };

    /* ===================== WEEK (ISO) ===================== */

    const filterLogsByWeek = (logs, selectedWeek) => {
        const [year, week] = selectedWeek.split("-W").map(Number);

        const firstDayOfYear = new Date(Date.UTC(year, 0, 1));
        const dayOfWeek = firstDayOfYear.getUTCDay();

        const firstISOWeekStart = new Date(
            Date.UTC(
                year,
                0,
                1 + (dayOfWeek <= 4 ? -dayOfWeek + 1 : 8 - dayOfWeek)
            )
        );

        const startOfWeek = new Date(
            firstISOWeekStart.getTime() + (week - 1) * 7 * 24 * 60 * 60 * 1000
        );
        const endOfWeek = new Date(
            startOfWeek.getTime() + 6 * 24 * 60 * 60 * 1000
        );

        startOfWeek.setUTCHours(0, 0, 0, 0);
        endOfWeek.setUTCHours(23, 59, 59, 999);

        return logs.filter(log =>
            log.timestamp >= startOfWeek.getTime() &&
            log.timestamp <= endOfWeek.getTime()
        );
    };

    /* ===================== MONTH ===================== */

    const filterLogsByMonth = (logs, selectedYear, selectedMonth) => {
        const month = parseInt(selectedMonth.split("-")[1], 10);

        const startOfMonth = new Date(selectedYear, month - 1, 1).getTime();
        const endOfMonth = new Date(
            selectedYear,
            month,
            0,
            23,
            59,
            59,
            999
        ).getTime();

        return logs.filter(log =>
            log.timestamp >= startOfMonth && log.timestamp <= endOfMonth
        );
    };

    /* ===================== YEAR ===================== */

    const filterLogsByYear = (logs, selectedYear) => {
        const startOfYear = new Date(selectedYear, 0, 1).getTime();
        const endOfYear = new Date(
            selectedYear,
            11,
            31,
            23,
            59,
            59,
            999
        ).getTime();

        return logs.filter(log =>
            log.timestamp >= startOfYear && log.timestamp <= endOfYear
        );
    };

    /* ===================== RANGE (NEW) ===================== */

    const filterLogsByRange = (logs, startDate, endDate) => {
        const startOfRange = new Date(startDate).setHours(0, 0, 0, 0);
        const endOfRange = new Date(endDate).setHours(23, 59, 59, 999);

        return logs.filter(log =>
            log.timestamp >= startOfRange && log.timestamp <= endOfRange
        );
    };

    /* ===================== LOGS: EXCEL ===================== */

    const downloadLogsExcel = () => {
        const today = new Date();
        const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        const formattedTime = today.toLocaleTimeString();

        const sourceLogs = filteredLogs.length ? filteredLogs : logs;

        if (!sourceLogs.length) {
            alert("No logs to download");
            return;
        }

        const headers = ["#", "User", "Item Name", "Action Type", "Details", "Date & Time"];

        const rows = sourceLogs.map((log, i) => [
            i + 1,
            log.deletedBy || log.editedBy || "-",
            log.itemName || "-",
            log.type?.toUpperCase() || "-",
            log.changes ? log.changes.join("; ") : "-",
            new Date(log.timestamp).toLocaleString()
        ]);

        const meta = [
            [`SYSTEM ACTIVITY LOGS REPORT - ${formattedDate}`],
            [`Business Name: ${bizName}`],
            [`Generated On: ${formattedDate} at ${formattedTime}`],
            [`Generated By: ${userAccountName}`],
            []
        ];

        const wsData = [...meta, headers, ...rows];
        const worksheet = XLSX.utils.aoa_to_sheet(wsData);
        const workbook = XLSX.utils.book_new();

        XLSX.utils.book_append_sheet(workbook, worksheet, "Logs");

        const fileName = `system_logs_${formattedDate.replace(/\//g, "-")}`;
        XLSX.writeFile(workbook, `${fileName}.xlsx`);
    };

    /* ===================== LOGS: PDF ===================== */

    const downloadLogsPDF = () => {
        const today = new Date();
        const formattedDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;
        const formattedTime = today.toLocaleTimeString();

        // Use filtered logs if available
        const sourceLogs = filteredLogs.length ? filteredLogs : logs;

        if (!sourceLogs.length) {
            alert("No logs to download");
            return;
        }

        // Headers for the PDF
        const headers = ["#", "User", "Action", "Item", "Details", "Date & Time"];

        // Map each log to a row
        const rows = sourceLogs.map((log, i) => {
            let itemName = log.itemId;
            const item = sortedItems.find(it => it.id === log.itemId);
            if (item) itemName = item.name;

            // 1. Ensure details is a single string without hidden line breaks
            const details = log.changes ? log.changes.join(" | ") : "-";

            // 2. Ensure the returned array has exactly 6 elements to match your headers
            return [
                (i + 1).toString(),                   // #
                // Item
                (log.deletedBy || log.editedBy || "-"),
                (log.type?.toUpperCase() || "-"),      // Action
                itemName,
                details,                              // Details
                new Date(log.timestamp).toLocaleString() // Date & Time
            ];
        });
        const title = `SYSTEM ACTIVITY LOGS REPORT - ${formattedDate}`;
        const meta = [
            `Business Name: ${bizName}`,
            `Generated On: ${formattedDate} at ${formattedTime}`,
            `Generated By: ${userAccountName}`
        ];

        const fileName = `system_logs_${formattedDate.replace(/\//g, "-")}`;

        downloadPDF(title, headers, rows, fileName, meta);
    };



    return (

        <div className="rounded">

            <section className={`p-4  max-w-7xl mx-auto rounded-xl 
               ${theme === "Dark"
                    ? "text-white  "
                    : "bg-gray-200 text-black "
                }`}
            >
                {/* Summary Cards */}

                <div className="flex flex-wrap items-center justify-start mb-6 gap-y-2">

                    <h3 className="text-sm sm:text-lg font-bold text-left">
                        Summary Reports
                    </h3>

                    <button
                        onClick={DateModalFunBtn}
                        className={`py-2 px-4 rounded-lg mx-10 text-xs sm:text-sm
    ${theme === "Dark"
                                ? "bg-blue-800 text-white hover:bg-blue-600"
                                : "bg-blue-600 text-white hover:bg-blue-800"
                            }`}
                    >
                        Choose Date / Time
                    </button>

                    {/* NEW: shows which filter (day/week/month/year/range) is currently applied */}
                    <span
                        className={`text-xs sm:text-sm font-medium italic
                        ${theme === "Dark" ? "text-gray-300" : "text-gray-700"}`}
                    >
                        {appliedFilterLabel}
                    </span>

                    <div>

                    </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                    {reportData.map(({ label, value, icon, iconColor }) => (
                        <div
                            key={label}
                            className={`shadow p-3 sm:p-4 rounded-xl 
        flex flex-col sm:flex-row items-center gap-2 sm:gap-3
        ${theme === "Dark" ? "bg-[#132962]" : "bg-white"}
      `}
                        >
                            {/* Icon */}
                            <div
                                className={`flex items-center justify-center 
          w-8 h-8 sm:w-12 sm:h-12 
          rounded-full ${iconColor}`}
                            >
                                <span className="text-xs sm:text-lg text-white">
                                    {icon}
                                </span>
                            </div>

                            {/* Text */}
                            <div className="text-center sm:text-left">
                                <h3 className="text-xs sm:text-sm font-semibold leading-tight">
                                    {label}
                                </h3>
                                <p className="text-sm sm:text-xl font-bold">
                                    {value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>


                {/* SALES & EMPLOYEE ANALYTICS */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

                    {/* SALES GRAPH */}
                    <div
                        className={`md:col-span-2 shadow p-1 sm:p-4 rounded-lg
      ${theme === "Dark" ? "bg-[#132962]" : "bg-white"}`}
                    >

                        {/* CONTROLS */}
                        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:justify-between sm:items-center">

                            <div className="flex flex-col sm:flex-row gap-2">
                                <button
                                    onClick={() => setActiveGraph("payment")}
                                    className={`w-auto mx-auto sm:w-auto px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm
            ${activeGraph === "payment"
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 text-gray-700"
                                        }`}
                                >
                                    Payment Method
                                </button>
                                <button
                                    onClick={() => setActiveGraph("time")}
                                    className={`w-auto mx-auto sm:w-auto px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm
            ${activeGraph === "time"
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 text-gray-700"
                                        }`}
                                >
                                    Sales Over Time
                                </button>

                                <button
                                    onClick={() => setActiveGraph("hour")}
                                    className={`w-auto mx-auto sm:w-auto px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm
            ${activeGraph === "hour"
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 text-gray-700"
                                        }`}
                                >
                                    Sales Per Hour
                                </button>
                            </div>

                            <div className="flex justify-center sm:justify-end">
                                <div className="relative">
                                    <button
                                        onClick={() => setOpen(prev => !prev)}
                                        className={`w-full sm:w-auto text-xs sm:text-sm px-5 py-2 rounded-lg
              ${theme === "Dark"
                                                ? "bg-blue-800 text-white hover:bg-blue-600"
                                                : "bg-blue-600 text-white hover:bg-blue-800"
                                            }`}
                                    >
                                        Download ▾
                                    </button>

                                    {open && (
                                        <div
                                            className={`absolute right-0 mt-1 w-36 rounded-lg shadow  
                ${theme === "Dark"
                                                    ? "bg-slate-800 text-white"
                                                    : "bg-white text-black"
                                                }`}
                                        >
                                            <button
                                                onClick={() => {
                                                    downloadSalesExcel();
                                                    setOpen(false);
                                                }}
                                                className="block w-full text-left px-3 py-2 text-xs smtext-sm hover:bg-blue-500 hover:text-white"
                                            >
                                                Excel (.xlsx)
                                            </button>

                                            <button
                                                onClick={() => {
                                                    downloadSalesPDF();
                                                    setOpen(false);
                                                }}
                                                className="block w-full text-left px-3 py-2 text-xs smtext-sm hover:bg-blue-500 hover:text-white"
                                            >
                                                PDF (.pdf)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>


                        {/* GRAPH */}
                        <div className="sm:p-4 rounded-xl shadow">

                            {activeGraph === "payment" && (
                                <>
                                    <h3 className="text-xs sm:text-md font-bold mb-2">
                                        Payment Methods
                                    </h3>
                                    <div className="h-[300px] sm:h-[380px]">
                                        <Line
                                            data={dataPaymentOverTime}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                            }}
                                        />
                                    </div>
                                </>
                            )}

                            {activeGraph === "time" && (
                                <>
                                    <h3 className="text-xs sm:text-md font-bold mb-2">
                                        Sales Over Time
                                    </h3>
                                    <div className="h-[300px] sm:h-[380px]">
                                        <Line
                                            data={dataSalesOverTime}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                            }}
                                        />
                                    </div>
                                </>
                            )}

                            {activeGraph === "hour" && (
                                <>
                                    <h3 className="text-xs sm:text-md font-bold mb-2">
                                        Sales Per Hour
                                    </h3>
                                    <div className="h-[300px] sm:h-[380px]">
                                        <Line
                                            data={dataSalesPerHour}
                                            options={{
                                                responsive: true,
                                                maintainAspectRatio: false,
                                            }}
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>

                    {/* EMPLOYEE SECTION */}
                    <div
                        className={`shadow p-3 sm:p-4 rounded-xl
    ${theme === "Dark" ? "bg-[#132962]" : "bg-white"}`}
                    >

                        {/* TOGGLES */}
                        <div className="flex justify-center gap-2 mb-4 flex-wrap">
                            <button
                                onClick={() => setActiveView("pie")}
                                className={`px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm
        ${activeView === "pie"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-200 text-gray-700"
                                    }`}
                            >
                                Employee Sales
                            </button>

                            <button
                                onClick={() => setActiveView("table")}
                                className={`px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm
        ${activeView === "table"
                                        ? "bg-blue-600 text-white"
                                        : "bg-gray-200 text-gray-700"
                                    }`}
                            >
                                Performance
                            </button>
                        </div>

                        {/* DOWNLOAD (CENTERED) */}
                        <div className="relative flex justify-center mb-4">
                            <button
                                onClick={() => setOpenEmp(prev => !prev)}
                                className={`text-xs sm:text-sm px-5 py-2 rounded-lg
        ${theme === "Dark"
                                        ? "bg-blue-800 text-white hover:bg-blue-600"
                                        : "bg-blue-600 text-white hover:bg-blue-800"
                                    }`}
                            >
                                Download ▾
                            </button>

                            {openEmp && (
                                <div
                                    className={`absolute top-full mt-1 left-1/2 -translate-x-1/2
          w-36 rounded-lg shadow  
          ${theme === "Dark"
                                            ? "bg-slate-800 text-white"
                                            : "bg-white text-black"
                                        }`}
                                >
                                    <button
                                        onClick={() => {
                                            downloadEmployeeExcel();
                                            setOpenEmp(false);
                                        }}
                                        className="block w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-blue-500 hover:text-white"
                                    >
                                        Excel (.xlsx)
                                    </button>

                                    <button
                                        onClick={() => {
                                            downloadEmployeePDF();
                                            setOpenEmp(false);
                                        }}
                                        className="block w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-blue-500 hover:text-white"
                                    >
                                        PDF (.pdf)
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* PIE */}
                        {activeView === "pie" && (
                            <>
                                <h3 className="text-xs sm:text-md font-bold mb-2 text-center">
                                    Employee Sales
                                </h3>
                                <div className="h-[260px] sm:h-[300px]">
                                    <Pie
                                        data={dataEmployeeSales}
                                        options={{
                                            responsive: true,
                                            maintainAspectRatio: false,
                                        }}
                                    />
                                </div>
                            </>
                        )}

                        {/* TABLE */}
                        {activeView === "table" && (
                            <div className="p-3 rounded-xl shadow overflow-x-auto">
                                <h3 className="font-semibold mb-2 text-center">
                                    Cashier Performance
                                </h3>
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b">
                                            <th className="text-left p-2">Cashier</th>
                                            <th className="text-left p-2">Transactions</th>
                                            <th className="text-left p-2">Avg Sale</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(employeeTransactions).map(emp => (
                                            <tr key={emp} className="border-b">
                                                <td className="p-2">{emp}</td>
                                                <td className="p-2">{employeeTransactions[emp]}</td>
                                                <td className="p-2">
                                                    KES {employeeAvgSale[emp]?.toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                    {/* Sales by Categories */}
                    <div
                        className={`shadow sm:p-4  p-2 rounded-xl
    ${theme === "Dark" ? "bg-[#132962]" : "bg-white"}`}
                    >
                        <div>
                            <h3 className="text-sm sm:text-md mb-4 flex justify-between items-center">
                                <span className="font-bold">Sales by Categories</span>

                                {/* Download */}
                                <div className="relative">
                                    <button
                                        onClick={() => setOpenCat(prev => !prev)}
                                        className={`text-xs sm:text-sm px-2 py-2 rounded-lg
            ${theme === "Dark"
                                                ? "bg-blue-800 text-white hover:bg-blue-600"
                                                : "bg-blue-600 text-white hover:bg-blue-800"
                                            }`}
                                    >
                                        Download ▾
                                    </button>

                                    {openCat && (
                                        <div
                                            className={`absolute right-0 mt-1 w-32 rounded-lg shadow  
              ${theme === "Dark"
                                                    ? "bg-slate-800 text-white"
                                                    : "bg-white text-black"
                                                }`}
                                        >
                                            <button
                                                onClick={() => {
                                                    setOpenCat(false);
                                                    downloadCategoriesExcel();
                                                }}
                                                className="block w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-blue-500 hover:text-white"
                                            >
                                                Excel (.xlsx)
                                            </button>

                                            <button
                                                onClick={() => {
                                                    setOpenCat(false);
                                                    downloadCategoriesPDF();
                                                }}
                                                className="block w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-blue-500 hover:text-white"
                                            >
                                                PDF (.pdf)
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </h3>
                        </div>

                        {/* GRAPH */}
                        <div className="h-[300px] sm:h-[300px]">
                            <Bar
                                data={dataCategories}
                                options={{
                                    responsive: true,
                                    maintainAspectRatio: false,
                                }}
                            />
                        </div>
                    </div>

                    {/* Sales by items */}
                    <div
                        className={`shadow p-4 rounded-xl overflow-y-auto h-96 ${theme === "Dark" ? "bg-[#132962]" : "bg-white"
                            }`}
                    >
                        {/* Title, toggle and buttons */}
                        <div className="flex flex-col gap-3 mb-4 sm:flex-row sm:items-center sm:justify-between">
                            <h3 className="text-sm sm:text-md font-bold mb-0">Items Stats</h3>

                            <div className="flex items-center gap-2 flex-wrap justify-center sm:justify-end">
                                {/* View toggle: Items (unchanged) vs By Employee (NEW) */}
                                <button
                                    onClick={() => setActiveItemView("items")}
                                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm
                                    ${activeItemView === "items"
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 text-gray-700"
                                        }`}
                                >
                                    Items
                                </button>
                                <button
                                    onClick={() => setActiveItemView("employee")}
                                    className={`px-3 py-1.5 rounded-lg font-semibold text-xs sm:text-sm
                                    ${activeItemView === "employee"
                                            ? "bg-blue-600 text-white"
                                            : "bg-gray-200 text-gray-700"
                                        }`}
                                >
                                    By Employee
                                </button>

                                {/* Download for Items view */}
                                {activeItemView === "items" && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenItem((prev) => !prev)}
                                            className={`text-xs sm:text-sm px-4 sm:py-2 py-1 rounded-lg ${theme === "Dark"
                                                ? "text-white bg-blue-800 hover:bg-blue-600"
                                                : "bg-blue-600 text-white hover:bg-blue-800"
                                                }`}
                                        >
                                            Download ▾
                                        </button>

                                        {openItem && (
                                            <div
                                                className={`absolute right-0 mt-1 w-32 rounded-lg shadow   ${theme === "Dark"
                                                    ? "bg-slate-800 text-white"
                                                    : "bg-white text-black"
                                                    }`}
                                            >
                                                <button
                                                    onClick={() => {
                                                        setOpenItem(false);
                                                        downloadItemsExcel();
                                                    }}
                                                    className="block w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-blue-500 hover:text-white"
                                                >
                                                    Excel (.xlsx)
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setOpenItem(false);
                                                        downloadItemsPDF();
                                                    }}
                                                    className="block w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-blue-500 hover:text-white"
                                                >
                                                    PDF (.pdf)
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Download for By Employee view (NEW) */}
                                {activeItemView === "employee" && (
                                    <div className="relative">
                                        <button
                                            onClick={() => setOpenItem((prev) => !prev)}
                                            className={`text-xs sm:text-sm px-4 sm:py-2 py-1 rounded-lg ${theme === "Dark"
                                                ? "text-white bg-blue-800 hover:bg-blue-600"
                                                : "bg-blue-600 text-white hover:bg-blue-800"
                                                }`}
                                        >
                                            Download ▾
                                        </button>

                                        {openItem && (
                                            <div
                                                className={`absolute right-0 mt-1 w-40 rounded-lg shadow   ${theme === "Dark"
                                                    ? "bg-slate-800 text-white"
                                                    : "bg-white text-black"
                                                    }`}
                                            >
                                                <button
                                                    onClick={() => {
                                                        setOpenItem(false);
                                                        downloadEmployeeItemsExcel();
                                                    }}
                                                    className="block w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-blue-500 hover:text-white"
                                                >
                                                    Excel (.xlsx)
                                                </button>

                                                <button
                                                    onClick={() => {
                                                        setOpenItem(false);
                                                        downloadEmployeeItemsPDF();
                                                    }}
                                                    className="block w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-blue-500 hover:text-white"
                                                >
                                                    PDF (.pdf)
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                        </div>

                        {/* ITEMS VIEW (unchanged) */}
                        {activeItemView === "items" && (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead className={`${theme === "Dark" ? "bg-blue-800" : "bg-blue-600 text-white"}`}>
                                        <tr>
                                            <th
                                                className={`border px-4 py-1 text-xs sm:text-md ${theme === "Dark" ? "border-blue-800" : "border-gray-300"}`}
                                            >
                                                #
                                            </th>
                                            <th
                                                className={`border px-2 py-1 text-xs sm:text-md cursor-pointer ${theme === "Dark" ? "border-blue-800" : "border-gray-300"}`}
                                                onClick={() => handleSort("name")}
                                            >
                                                Item {sortConfig.key === "name" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                            </th>
                                            <th
                                                className={`border px-2 py-1 text-xs sm:text-md cursor-pointer ${theme === "Dark" ? "border-blue-800" : "border-gray-300"}`}
                                                onClick={() => handleSort("stock")}
                                            >
                                                Quantity {sortConfig.key === "stock" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                            </th>
                                            <th
                                                className={`border px-2 py-1 text-xs sm:text-md cursor-pointer ${theme === "Dark" ? "border-blue-800" : "border-gray-300"}`}
                                                onClick={() => handleSort("totalSales")}
                                            >
                                                Sales (KES) {sortConfig.key === "totalSales" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                            </th>
                                            {/* in the table head, after "Sales (KES)" */}
                                            <th
                                                className={`border px-2 py-1 text-xs sm:text-md cursor-pointer ${theme === "Dark" ? "border-blue-800" : "border-gray-300"}`}
                                                onClick={() => handleSort("totalProfit")}
                                            >
                                                Profit (KES) {sortConfig.key === "totalProfit" && (sortConfig.direction === "asc" ? "↑" : "↓")}
                                            </th>

                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedItems.map((item, index) => (
                                            <tr
                                                key={index}
                                                className={`text-xs sm:text-sm ${theme === "Dark" ? "hover:bg-blue-100 hover:text-black" : "bg-white border hover:bg-blue-100"}`}
                                            >
                                                <td className={`px-4 text-center py-2  text-xs sm:text-sm ${theme === "Dark" ? "border-blue-800" : "border-gray-300 border"}`}>{index + 1}</td>
                                                <td className={`p-2 text-center text-xs sm:text-sm ${theme === "Dark" ? "border-blue-800" : "border-gray-300 border"}`}>
                                                    {item.name || "N/A"}
                                                </td>
                                                <td className={`p-2 text-center text-xs sm:text-sm ${theme === "Dark" ? "border-blue-800" : "border-gray-300 border"}`}>
                                                    {item.stock || 0}
                                                </td>
                                                <td className={`p-2 text-center text-xs sm:text-sm ${theme === "Dark" ? "border-blue-800" : "border-gray-300 border"}`}>
                                                    {(item.totalSales || 0).toFixed(2)}
                                                </td>
                                                {/* in the table body, after the Sales (KES) <td> */}
                                                <td className={`p-2 text-center text-xs sm:text-sm ${theme === "Dark" ? "border-blue-800" : "border-gray-300 border"}`}>
                                                    {(item.totalProfit || 0).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}


                                    </tbody>

                                </table>
                                <p
                                    className={`mt-4 pt-2 text-sm sm:text-base font-medium text-right border-t
    ${theme === "Dark"
                                            ? "text-gray-200 border-gray-700"
                                            : "text-gray-800 border-gray-300"
                                        }`}
                                >
                                    Total Sales: <span className="font-semibold text-sm sm:text-lg">KES {totalSales?.toLocaleString() || 0}</span>
                                </p>



                            </div>
                        )}

                        {/* BY EMPLOYEE VIEW (NEW): each employee grouped with the items they sold */}
                        {activeItemView === "employee" && (
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse">
                                    <thead className={`${theme === "Dark" ? "bg-blue-800" : "bg-blue-600 text-white"}`}>
                                        <tr>
                                            <th className={`border px-2 py-1 text-xs sm:text-md ${theme === "Dark" ? "border-blue-800" : "border-gray-300"}`}>
                                                Employee
                                            </th>
                                            <th className={`border px-2 py-1 text-xs sm:text-md ${theme === "Dark" ? "border-blue-800" : "border-gray-300"}`}>
                                                Item
                                            </th>
                                            <th className={`border px-2 py-1 text-xs sm:text-md ${theme === "Dark" ? "border-blue-800" : "border-gray-300"}`}>
                                                Quantity
                                            </th>
                                            <th className={`border px-2 py-1 text-xs sm:text-md ${theme === "Dark" ? "border-blue-800" : "border-gray-300"}`}>
                                                Sales (KES)
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.keys(employeeItemSales).length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={4}
                                                    className={`text-center p-4 text-xs sm:text-sm italic opacity-70 ${theme === "Dark" ? "border-blue-800" : "border-gray-300 border"}`}
                                                >
                                                    No data available
                                                </td>
                                            </tr>
                                        )}

                                        {Object.entries(employeeItemSales).map(([empId, items]) => {
                                            const itemsArr = Object.values(items);
                                            return itemsArr.map((item, i) => (
                                                <tr
                                                    key={`${empId}-${item.name}`}
                                                    className={`text-xs sm:text-sm ${theme === "Dark" ? "hover:bg-blue-100 hover:text-black" : "bg-white border hover:bg-blue-100"}`}
                                                >
                                                    {i === 0 && (
                                                        <td
                                                            rowSpan={itemsArr.length}
                                                            className={`p-2 text-center align-top font-semibold text-xs sm:text-sm ${theme === "Dark" ? "border-blue-800" : "border-gray-300 border"}`}
                                                        >
                                                            {empId}
                                                        </td>
                                                    )}
                                                    <td className={`p-2 text-center text-xs sm:text-sm ${theme === "Dark" ? "border-blue-800" : "border-gray-300 border"}`}>
                                                        {item.name || "N/A"}
                                                    </td>
                                                    <td className={`p-2 text-center text-xs sm:text-sm ${theme === "Dark" ? "border-blue-800" : "border-gray-300 border"}`}>
                                                        {item.stock || 0}
                                                    </td>
                                                    <td className={`p-2 text-center text-xs sm:text-sm ${theme === "Dark" ? "border-blue-800" : "border-gray-300 border"}`}>
                                                        {(item.totalSales || 0).toFixed(2)}
                                                    </td>
                                                </tr>
                                            ));
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}

                    </div>

                </div>


                {/* Activity Logs Section */}
                <div className={`shadow p-4 rounded-xl h-96 ${theme === "Dark" ? "bg-[#132962]" : "bg-white"} flex flex-col`}>

                    <div className="flex items-center justify-between mb-4">
                        {/* Title */}
                        <h3 className="text-xs sm:text-sm font-bold mb-0">Inventory Activity Logs</h3>

                        {/* Download Button */}
                        <div className="relative">
                            <button
                                onClick={() => setOpenLog((prev) => !prev)}
                                className={`text-xs sm:text-sm px-4 py-1 sm:py-2 rounded-lg ${theme === "Dark"
                                    ? "text-white bg-blue-800 hover:bg-blue-600"
                                    : "bg-blue-600 text-white hover:bg-blue-800"
                                    }`}
                            >
                                Download ▾
                            </button>

                            {openLog && (
                                <div
                                    className={`absolute right-0 mt-1 w-32 rounded-lg shadow   text-xs sm:text-base ${theme === "Dark" ? "bg-slate-800 text-white" : "bg-white text-black"}`}
                                >
                                    <button
                                        onClick={() => {
                                            setOpenLog(false);
                                            downloadLogsExcel();
                                        }}
                                        className="block w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-blue-500 hover:text-white"
                                    >
                                        Excel (.xlsx)
                                    </button>
                                    <button
                                        onClick={() => {
                                            setOpenLog(false);
                                            downloadLogsPDF();
                                        }}
                                        className="block w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-blue-500 hover:text-white"
                                    >
                                        PDF (.pdf)
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Table Wrapper for scroll */}
                    <div className="flex-1 overflow-auto">
                        <div className="overflow-x-auto">
                            <table className="w-full table-auto min-w-[600px] border-collapse">
                                <thead className={`${theme === "Dark" ? "bg-blue-800 text-white" : "bg-blue-600 text-white"}`}>
                                    <tr>
                                        <th className={`border px-2 py-1 text-xs sm:text-sm w-10 ${theme === "Dark" ? "border-blue-700" : "border-gray-300"}`}>#</th>
                                        <th className={`border px-2 py-1 text-xs sm:text-sm w-30 ${theme === "Dark" ? "border-blue-700" : "border-gray-300"}`}>User</th>
                                        <th className={`border px-2 py-1 text-xs sm:text-sm w-20 ${theme === "Dark" ? "border-blue-700" : "border-gray-300"}`}>Action</th>
                                        <th className={`border px-2 py-1 text-xs sm:text-sm w-50 ${theme === "Dark" ? "border-blue-700" : "border-gray-300"}`}>Item Name</th>
                                        <th className={`border px-2 py-1 text-xs sm:text-sm max-w-[200px] ${theme === "Dark" ? "border-blue-700" : "border-gray-300"}`}>Details</th>
                                        <th className={`border px-2 py-1 text-xs sm:text-sm w-30 ${theme === "Dark" ? "border-blue-700" : "border-gray-300"}`}>Timestamp</th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {filteredLogs && Object.entries(filteredLogs).reverse().map(([key, log], index) => (
                                        <tr
                                            key={key}
                                            className={`text-xs ${theme === "Dark" ? "hover:bg-blue-100 hover:text-black text-white" : "bg-white border hover:bg-blue-100 text-black"}`}
                                        >
                                            {/* Index */}
                                            <td className={`px-2 text-center py-2 text-xs sm:text-sm ${theme === "Dark" ? "border-blue-900" : "border-gray-300 border"}`}>
                                                {index + 1}
                                            </td>

                                            {/* User */}
                                            <td className={`p-2 text-center break-words text-xs sm:text-sm ${theme === "Dark" ? "border-blue-900" : "border-gray-300 border"}`}>
                                                {log.editedBy || log.deletedBy || log.addedBy || "System"}
                                            </td>

                                            {/* Type */}
                                            <td className={`p-2 text-center text-xs sm:text-sm ${theme === "Dark" ? "border-blue-900" : "border-gray-300 border"}`}>
                                                <span className={`font-bold uppercase ${log.type === 'delete' ? 'text-red-500' :
                                                    log.type === 'edit' ? 'text-blue-600' :
                                                        log.type === 'add' ? 'text-green-600' : 'text-gray-600'
                                                    }`}>
                                                    {log.type}
                                                </span>
                                            </td>

                                            {/* Item Name */}
                                            <td className={`p-2 text-center break-all text-xs sm:text-sm ${theme === "Dark" ? "border-blue-900" : "border-gray-300 border"}`}>
                                                {log.itemName || "N/A"}
                                            </td>

                                            {/* Details / Changes */}
                                            <td className={`p-2 text-left leading-normal whitespace-normal break-words max-h-24 overflow-auto text-xs sm:text-sm ${theme === "Dark" ? "border-blue-900" : "border-gray-300 border"}`}>
                                                {log.type === 'edit' && log.changes ? (
                                                    <ul className="list-disc list-inside">
                                                        {log.changes.slice(0, 5).map((change, i) => (
                                                            <li key={i} className="mb-1">{change}</li>
                                                        ))}
                                                        {log.changes.length > 5 && <li className="italic text-gray-400">...more</li>}
                                                    </ul>
                                                ) : log.type === 'add' && log.details ? (
                                                    <ul className="list-disc list-inside">
                                                        {Object.entries(log.details).map(([key, value], i) => (
                                                            <li key={i} className="mb-1">{key}: {value}</li>
                                                        ))}
                                                    </ul>
                                                ) : log.type === 'delete' ? (
                                                    <span className="italic text-red-400 text-xs sm:text-sm">Item was Deleted</span>
                                                ) : (
                                                    <span className="italic text-gray-400 text-xs sm:text-sm">No details available</span>
                                                )}
                                            </td>

                                            {/* Timestamp */}
                                            <td className={`p-2 text-center whitespace-normal text-xs sm:text-sm ${theme === "Dark" ? "border-blue-900" : "border-gray-300 border"}`}>
                                                <div>{new Date(log.timestamp).toLocaleDateString()}</div>
                                                <div className="opacity-70">{new Date(log.timestamp).toLocaleTimeString()}</div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>

                            </table>
                        </div>
                    </div>
                </div>
            </section>

            {/**Date Modal */}
            {dateModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className={` p-6 rounded-xl shadow w-96  mx-4
                        ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white "
                        }`
                    }>

                        <h2 className="text-md sm:text-xl font-bold text-center mb-4">Select Date Range</h2>

                        <div className="flex justify-between mb-4 border-b overflow-x-auto">
                            <button
                                onClick={() => setActiveTab("day")}
                                className={`py-2 px-3 text-sm sm:text-base whitespace-nowrap ${activeTab === "day" ? "border-b-2 border-blue-500 text-blue-500 font-bold" : "text-gray-500"}`}
                            >
                                Day
                            </button>
                            <button
                                onClick={() => setActiveTab("week")}
                                className={`py-2 px-3  text-sm sm:text-base whitespace-nowrap ${activeTab === "week" ? "border-b-2 border-blue-500 text-blue-500 font-bold" : "text-gray-500"}`}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => setActiveTab("month")}
                                className={`py-2 px-3  text-sm sm:text-base whitespace-nowrap ${activeTab === "month" ? "border-b-2 border-blue-500 text-blue-500 font-bold" : "text-gray-500"}`}
                            >
                                Month
                            </button>
                            <button
                                onClick={() => setActiveTab("year")}
                                className={`py-2 px-3  text-sm sm:text-base whitespace-nowrap ${activeTab === "year" ? "border-b-2 border-blue-500 text-blue-500 font-bold" : "text-gray-500"}`}
                            >
                                Year
                            </button>
                            {/* NEW: Range tab */}
                            <button
                                onClick={() => setActiveTab("range")}
                                className={`py-2 px-3  text-sm sm:text-base whitespace-nowrap ${activeTab === "range" ? "border-b-2 border-blue-500 text-blue-500 font-bold" : "text-gray-500"}`}
                            >
                                Range
                            </button>
                        </div>

                        {/* Content for Each Tab */}
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
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
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
                                    value={selectedWeek}
                                    onChange={(e) => setSelectedWeek(e.target.value)}
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
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
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
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
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

                        {/* NEW: Range tab content — From / To date pickers */}
                        {activeTab === "range" && (
                            <div className="mb-4 space-y-3">
                                <div>
                                    <label className={`block text-xs sm:text-sm font-medium mb-2
                                       ${theme === "Dark"
                                            ? "text-white"
                                            : " text-black  "
                                        }`}
                                    >From</label>
                                    <input
                                        type="date"
                                        value={selectedRangeStart}
                                        onChange={(e) => setSelectedRangeStart(e.target.value)}
                                        className="w-full px-4 py-2 border rounded focus:ring-2 focus:outline-none text-black text-sm sm:text-base"
                                    />
                                </div>
                                <div>
                                    <label className={`block text-xs sm:text-sm font-medium mb-2
                                       ${theme === "Dark"
                                            ? "text-white"
                                            : " text-black  "
                                        }`}
                                    >To</label>
                                    <input
                                        type="date"
                                        value={selectedRangeEnd}
                                        min={selectedRangeStart || undefined}
                                        onChange={(e) => setSelectedRangeEnd(e.target.value)}
                                        className="w-full px-4 py-2 border rounded focus:ring-2 focus:outline-none text-black text-sm sm:text-base"
                                    />
                                </div>
                            </div>
                        )}

                        <div className="flex justify-around mt-3">
                            <button
                                onClick={() => {
                                    handleFilter();

                                    handleLogsFilter();
                                }}
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


            {cartModal && (
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
                        <p>No Sales have been Made</p>
                    </div>
                </div>
            )}

            {timeModal && (
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
                        <p>Did not Select Time</p>
                    </div>
                </div>
            )}



        </div>
    );
};

export default Reports;
