"use client"

import { useState } from "react";
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
import { useUserID } from "@/app/componets/zustand/profile";
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


const Reports = () => {

    //Zustand
    const employeeTotal = useUserEmployeeTotal((state) => state.userEmployeeTotal)
    const categoriesTotal = useUserCategoriesTotal((state) => state.userCategoriesTotal)
    const itemsTotal = useUserItemsTotal((state) => state.userItemsTotal)
    const cart = useUserCart((state) => state.userCart)
    const theme = useUserTheme((state) => state.userTheme)

    const [filteredCart, setFilteredCart] = useState()


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
            console.log("Item Date:", itemDate, "In Range:", itemDate >= startOfDay && itemDate <= endOfDay);
            return itemDate >= startOfDay && itemDate <= endOfDay;
        });
        return filtered;
    };


    //// Reports functions
    const calculateAnalytics = (cart) => {
        // Initialize variables for the sales data
        let salesOverYear = new Array(12).fill(0); // 12 months of the year
        let salesOverMonth = new Array(5).fill(0);
        let salesOverWeek = new Array(7).fill(0);
        let salesOverDay = new Array(24).fill(0);
        let employeeSales = {};
        let itemSales = [];
        let categorySales = {};
        let label = []


        console.log("cart", cart)

        // Iterate through the cart items to calculate each of these metrics
        cart.forEach((item) => {

            if (!item.Date || !item.EmployeeID || !item.Total || !item.Cart) {
                console.log("Invalid item data:", item); // Log invalid data
                return; // Skip this item
            }

            console.log("item", item)

            const itemDate = new Date(item.Date);
            const itemMonth = itemDate.getMonth(); // Get the month (0-11)
            const itemYear = itemDate.getFullYear();
            const itemDay = itemDate.getDate();
            const itemDayOfWeek = itemDate.getDay();
            const itemHour = itemDate.getHours();


            if (activeTab == "year") {
                label = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
                salesOverYear[itemMonth] += item.Total
                setTotalSales(salesOverYear.reduce((acc, curr) => acc + curr, 0))

            }
            else if (activeTab == "month") {
                label = ["1", "2", "3", "4", "5"]

                const weekIndex = Math.floor((itemDay - 1) / 7);
                if (weekIndex < 5) {
                    salesOverMonth[weekIndex] += item.Total;
                }
                setTotalSales(salesOverMonth.reduce((acc, curr) => acc + curr, 0))

            }
            else if (activeTab == "week") {
                label = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"]
                salesOverWeek[itemDayOfWeek] += item.Total;
                setTotalSales(salesOverWeek.reduce((acc, curr) => acc + curr, 0))

            }
            else if (activeTab == "day") {
                label = ["00", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23"]
                salesOverDay[itemHour] += item.Total;
                setTotalSales(salesOverDay.reduce((acc, curr) => acc + curr, 0))
            }

            // Employee Sales
            if (employeeSales[item.EmployeeID]) {
                employeeSales[item.EmployeeID] += item.Total;
            } else {
                employeeSales[item.EmployeeID] = item.Total;
            }

            item.Cart.forEach(product => {
                const productTotal = product.stock * parseFloat(product.Price);

                const existingProduct = itemSales.find(p => p.name === product.Name);
                if (existingProduct) {
                    existingProduct.stock += product.stock;
                    existingProduct.totalSales += productTotal;
                } else {
                    itemSales.push({
                        name: product.Name,
                        stock: product.stock,
                        totalSales: productTotal
                    });
                }

                if (categorySales[product.Category]) {
                    categorySales[product.Category] += productTotal;
                } else {
                    categorySales[product.Category] = productTotal;
                }
            });

        });


        // Generate the sales over time data
        const dataSalesOverTime = {
            labels: label,
            datasets: [
                {
                    label: "Sales",
                    data: activeTab === "day" ? salesOverDay : activeTab === "week" ? salesOverWeek : activeTab === "month" ? salesOverMonth : salesOverYear,
                    borderColor: "#8884d8",
                    backgroundColor: "rgba(136, 132, 216, 0.5)",
                },
            ],
        };


        // Generate the employee sales data
        const dataEmployeeSales = {
            labels: Object.keys(employeeSales),
            datasets: [
                {
                    label: "Sales",
                    data: Object.values(employeeSales),
                    backgroundColor: ["#0088FE", "#00C49F", "#FFBB28", "#FF8042"], // Can randomize this if needed
                },
            ],
        };

        // Generate the category sales data
        const dataCategories = {
            labels: Object.keys(categorySales),
            datasets: [
                {
                    label: "Sales",
                    data: Object.values(categorySales),
                    backgroundColor: "#82ca9d",
                },
            ],
        };

        return { dataSalesOverTime, dataEmployeeSales, itemSales, dataCategories };
    };


    //// Report function control 
    const handleFilter = () => {

        if (cart) {

            if (selectedDate || selectedMonth || selectedWeek || selectedYear) {

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
                setDataCategories(analyticsData.dataCategories);

                console.log("Sales Over Time:", dataSalesOverTime);

                setDateModal(false);
            } else {
                console.log("select time")
                setDateModal(false);
                timeModalFun()
            }


        } else {
            setDateModal(false);
            cartModalFun()
            console.log("no data in tye report page")
        }

        // Close the modal
    };


    const reportData = [
        {
            label: 'Total Sales', value: totalSales, icon: <FaDollarSign className={`text-black text-3xl
              ${theme === "Dark"
                    ? " text-white"
                    : " text-blue-600 "
                }`}
            />,
        },
        {
            label: 'Products', value: itemsTotal, icon: <FaBox className={` text-3xl
              ${theme === "Dark"
                    ? " text-white"
                    : " text-blue-600 "
                }`}
            />,
        },
        {
            label: 'Categories', value: categoriesTotal, icon: <FaTags className={` text-3xl
              ${theme === "Dark"
                    ? " text-white"
                    : " text-blue-600 "
                }`}
            />,
        },
        {
            label: 'Employees', value: employeeTotal, icon: <FaUsers className={` text-4xl
              ${theme === "Dark"
                    ? " text-white"
                    : " text-blue-600 "
                }`}
            />,
        },
    ];


    // Print the items table
    const handlePrint = () => {
        window.print();
    };


    // Download the items as a CSV file
    const handleDownload = () => {
        const csvContent =
            "data:text/csv;charset=utf-8," +
            items
                .map((item) => `${item.name},${item.category},${item.stock}`)
                .join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "items.csv");
        document.body.appendChild(link); // Required for FF
        link.click();
        document.body.removeChild(link);
    };


    const [selectedCategory, setSelectedCategory] = useState('Canteen');

    // Filter items by selected category
    const filteredItems = itemSalesArray.filter(
        (item) => item.Categories === selectedCategory
    );

    // Download CSV
    const handleDownloadCSV = () => {
        const csvContent =
            'data:text/csv;charset=utf-8,' +
            ['#', 'Item', 'Quantity', 'Sales'].join(',') +
            '\n' +
            filteredItems
                .map((item, idx) =>
                    [idx + 1, item.name, item.stock, item.totalSales].join(',')
                )
                .join('\n');

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement('a');
        link.setAttribute('href', encodedUri);
        link.setAttribute('download', `${selectedCategory}_items.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };


    return (
        <div className="rounded">

            <section className={` p-4  max-w-7xl mx-auto rounded-xl

               ${theme === "Dark"
                    ? "text-white  "
                    : "bg-gray-200 text-black "
                }`}
            >
                {/* Summary Cards */}

                <h3 className="text-lg font-bold mb-4  ">
                    Summary Reports</h3>


                <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-4">

                    {reportData.map(({ label, value, icon, iconColor }) => (
                        <div key={label} className={` shadow p-4 rounded-xl flex items-center 
                          ${theme === "Dark"
                                ? " bg-[#132962]"
                                : " bg-white "
                            }`
                        }
                        >
                            <div className={`mr-4 ${iconColor}`}>
                                <span className="left-3 top-1/2 transform -translate-y-1/2 text-white">
                                    {icon}
                                </span>
                            </div>

                            <div className="ml-10"  >
                                <h3 className="text-md font-bold">{label}</h3>
                                <p className="text-2xl font-bold">{value}</p>
                            </div>

                        </div>
                    ))}
                </div>

                <button
                    onClick={DateModalFunBtn}
                    className={` py-2 px-4 rounded  m-2
                    ${theme === "Dark"
                            ? " bg-blue-800 text-white hover:bg-blue-600"
                            : " bg-blue-600 text-white hover:bg-blue-800"
                        }`
                    }
                >
                    Choose Time
                </button>


                {/**
                  <button
                    className="bg-green-500 text-sm text-white py-2 px-4 rounded shadow hover:bg-green-600 focus:outline-none focus:ring"
                    onClick={handlePrint}
                >
                    Print
                </button>

                <button
                    className="bg-blue-500 text-sm text-white py-2 px-4 rounded shadow hover:bg-blue-600 focus:outline-none focus:ring mx-3"
                    onClick={handleDownload}
                >
                    Download
                </button>
 
                    */}


                {/* Sales Over Time */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">

                    <div className={`col-span-2  shadow p-4 rounded-lg  
                     ${theme === "Dark"
                            ? " bg-[#132962]"
                            : " bg-white "
                        }`}
                    >
                        <h3 className="text-md font-bold mb-4">Sales Over Time</h3>

                        <div style={{ height: 300 }} className="flex justify-center">
                            <Line data={dataSalesOverTime} />

                        </div>
                    </div>

                    {/* Employee Sales */}
                    <div className={`col-span-1  shadow p-4 rounded-xl h-120 
                           ${theme === "Dark"
                            ? " bg-[#132962]"
                            : " bg-white "
                        }`}>
                        <h3 className="text-md font-bold mb-4">Employee Sales</h3>

                        <div style={{ height: 300 }}>
                            <Pie data={dataEmployeeSales} />
                        </div>

                    </div>
                </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">



                    {/* Sales by Categories */}
                    <div className={`shadow p-4 rounded-xl
                           ${theme === "Dark"
                            ? " bg-[#132962]"
                            : " bg-white "
                        }`}
                    >
                        <h3 className="text-md font-bold mb-4">Sales by Categories</h3>
                        <Bar data={dataCategories} />
                    </div>


                    {/* Sales by items */}

                    <div
                        className={`shadow p-4 rounded-xl overflow-y-auto h-96 mb-6 ${theme === 'Dark' ? 'bg-[#132962]' : 'bg-white'
                            }`}
                    >
                        {/* Title and buttons */}
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-md font-bold">Items in {selectedCategory}</h3>

                            <div className="flex items-center gap-2">
                                {/* Center buttons */}
                                <div className="flex gap-2 mx-auto">
                                    <button
                                        onClick={() => setSelectedCategory('Store')}
                                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Store
                                    </button>
                                    <button
                                        onClick={() => setSelectedCategory('Canteen')}
                                        className="px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                    >
                                        Canteen
                                    </button>
                                </div>

                                {/* Right button */}
                                <button
                                    onClick={handleDownloadCSV}
                                    className="px-3 py-1 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                >
                                    Download CSV
                                </button>
                            </div>
                        </div>

                        {/* Table */}
                        <table className="w-full border-collapse">
                            <thead
                                className={`top-0 ${theme === 'Dark' ? 'bg-blue-800' : 'bg-blue-600 text-white'
                                    }`}
                            >
                                <tr>
                                    <th
                                        className={`border px-4 py-1 text-md ${theme === 'Dark' ? 'border-blue-800' : 'border-gray-300'
                                            }`}
                                    >
                                        #
                                    </th>
                                    <th
                                        className={`border p-2 text-md ${theme === 'Dark' ? 'border-blue-800' : 'border-gray-300'
                                            }`}
                                    >
                                        Item
                                    </th>
                                    <th
                                        className={`border p-2 text-md ${theme === 'Dark' ? 'border-blue-800' : 'border-gray-300'
                                            }`}
                                    >
                                        Quantity
                                    </th>
                                    <th
                                        className={`border p-2 text-md ${theme === 'Dark' ? 'border-blue-800' : 'border-gray-300'
                                            }`}
                                    >
                                        Sales
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems.map((item, index) => (
                                    <tr
                                        key={index}
                                        className={`text-sm ${theme === 'Dark'
                                                ? 'hover:bg-blue-100 hover:text-black'
                                                : 'bg-white border hover:bg-blue-100'
                                            }`}
                                    >
                                        <td
                                            className={`px-4 text-center py-2 ${theme === 'Dark' ? 'border-blue-800' : 'border-gray-300 border'
                                                }`}
                                        >
                                            {index + 1}
                                        </td>
                                        <td
                                            className={`p-2 text-center text-sm ${theme === 'Dark' ? 'border-blue-800' : 'border-gray-300 border'
                                                }`}
                                        >
                                            {item.name || 'N/A'}
                                        </td>
                                        <td
                                            className={`p-2 text-center text-sm ${theme === 'Dark' ? 'border-blue-800' : 'border-gray-300 border'
                                                }`}
                                        >
                                            {item.stock || 0}
                                        </td>
                                        <td
                                            className={`p-2 text-center text-sm ${theme === 'Dark' ? 'border-blue-800' : 'border-gray-300 border'
                                                }`}
                                        >
                                            {item.totalSales}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                </div>
            </section>


            {/**Date Modal */}
            {dateModal && (

                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className={` p-6 rounded-xl shadow w-96 
                        ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white "
                        }`
                    }>

                        <h2 className="text-xl font-bold text-center mb-4">Select Date Range</h2>

                        <div className="flex justify-between mb-4 border-b">
                            <button
                                onClick={() => setActiveTab("day")}
                                className={`py-2 px-4 ${activeTab === "day" ? "border-b-2 border-blue-500 text-blue-500 font-bold" : "text-gray-500"}`}
                            >
                                Day
                            </button>
                            <button
                                onClick={() => setActiveTab("week")}
                                className={`py-2 px-4 ${activeTab === "week" ? "border-b-2 border-blue-500 text-blue-500 font-bold" : "text-gray-500"}`}
                            >
                                Week
                            </button>
                            <button
                                onClick={() => setActiveTab("month")}
                                className={`py-2 px-4 ${activeTab === "month" ? "border-b-2 border-blue-500 text-blue-500 font-bold" : "text-gray-500"}`}
                            >
                                Month
                            </button>
                            <button
                                onClick={() => setActiveTab("year")}
                                className={`py-2 px-4 ${activeTab === "year" ? "border-b-2 border-blue-500 text-blue-500 font-bold" : "text-gray-500"}`}
                            >
                                Year
                            </button>
                        </div>

                        {/* Content for Each Tab */}
                        {activeTab === "day" && (
                            <div className="mb-4">
                                <label className={`block text-sm font-medium mb-2  
                                 ${theme === "Dark"
                                        ? "text-white"
                                        : " text-black  "
                                    }`}
                                >Select a Day</label>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="w-full px-4 py-2 border rounded focus:ring-2   focus:outline-none text-black"
                                />
                            </div>
                        )}

                        {activeTab === "week" && (
                            <div className="mb-4">
                                <label className={`block text-sm font-medium  mb-2
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
                                <label className={`block text-sm font-medium  mb-2
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
                                <label className={`block text-sm font-medium text-gray-700 mb-2
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

                        <div className="flex justify-around mt-3">
                            <button
                                onClick={handleFilter}
                                className={` text-white px-4 py-2 rounded  mt-4 
                                
                              ${theme === "Dark"
                                        ? "bg-green-800  hover:bg-green-600"
                                        : "bg-green-600  hover:bg-green-800 "
                                    }`}
                            >
                                Apply Filter
                            </button>
                            <button
                                onClick={DateModalFun}
                                className={` text-white px-4 py-2 rounded mt-4
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
