"use client"

import itemsdata from "@/app/data/items";
import { useState } from "react";
import categoriesdata from "@/app/data/categories";
import { ref, update, push, remove } from 'firebase/database';
import { db } from "../../../config";
import { FaBoxOpen, FaClock, FaDollarSign, FaLocationArrow, FaMoneyBill, FaTags, FaTruck, FaUser } from "react-icons/fa";
import { MdEmail, MdLocationCity } from "react-icons/md"
import { GiPadlock } from "react-icons/gi";
import { GiDialPadlock } from "react-icons/gi";
import { FaPhoneAlt } from "react-icons/fa";
import { TbXboxX } from "react-icons/tb";
import { TiTick } from "react-icons/ti";

import { useUserSupplier, useUserSupplierData, useUserSupplierTotal } from "@/app/componets/zustand/supplier";
import { useUserSupplyItems, useUserSupplyItemsData, useUserSupplyItemsTotal } from "@/app/componets/zustand/supplyItems";
import { useUserID } from "@/app/componets/zustand/profile";
import { useUserTheme } from "@/app/componets/zustand/theme";



const Suppliers = () => {

    // Zustand
    const Id = useUserID((state) => state.userID)
    const suppliers = useUserSupplier((state) => state.userSupplier)
    const suppliersTotal = useUserSupplierTotal((state) => state.userSupplierTotal)
    const dates = useUserSupplierData((state) => state.userSupplierData) /////////////////////////  change if need be

    const theme = useUserTheme((state) => state.userTheme)

    const items = useUserSupplyItems((state) => state.userSupplyItems)
    const itemsTotal = useUserSupplyItemsTotal((state) => state.userSupplyItemsTotal)
    const itemsData = useUserSupplyItemsData((state) => state.userSupplyItemsData)


    ///// Filter Functions

    /// Filter supplier
    const filterDatesBySupplier = (supplierName, supplierItems) => {
        const filteredDates = supplierItems
            .filter((item) => item.SupplierID === supplierName)
            .map((item) => item.Date);

        // Remove duplicates and return unique dates
        return [...new Set(filteredDates)];
    };

    //// filter date
    const filterItemsByDate = (date, supplierItems) => {
        return supplierItems.filter((item) => item.Date === date);
    };


    // State structure

    const [filteredDates, setFilteredDates] = useState(null);
    const [filteredItems, setFilteredItems] = useState(null);

    // Handle supplier click
    const handleSupplierClick = (supplierName) => {

        // Filter dates by supplier
        const dates = filterDatesBySupplier(supplierName, items);

        setFilteredDates(dates);
        setFilteredItems(null)
    };

    // Handle date click
    const handleDateClick = (date) => {

        // Filter items by date
        const items1 = filterItemsByDate(date, items);
        setFilteredItems(items1);

    };


    /// Genearal Variables 

    const [searchQuery, setSearchQuery] = useState("");

    /// Modals
    // Add 

    const [itemName, setItemName] = useState('')
    const [itemBuyingPrice, setItemBuyingPrice] = useState('')
    const [itemWholesalePrice, setItemWholesalePrice] = useState('')
    const [itemDistributorPrice, setItemDistributorPrice] = useState('')
    const [itemRetailPrice, setItemRetailPrice] = useState('')
    const [itemStock, setItemStock] = useState('')
    const [ItemSupplyId, setItemSupplyId] = useState('')
    const [itemAmount, setItemAmount] = useState('')
    const [ItemEmployeeId, setItemEmployeeId] = useState('')

    const [supplyName, setSupplyName] = useState('')
    const [supplyPhone, setSupplyPhone] = useState('')
    const [supplyEmail, setSupplyEmail] = useState('')
    const [supplyLocation, setSupplyLocation] = useState('')


    const [itemModal, setItemModal] = useState(false)
    const [supplyModal, setSupplyModal] = useState(false);

    const itemModalFun = () => {
        setItemName('')
        setItemBuyingPrice('')
        setItemWholesalePrice('')
        setItemDistributorPrice('')
        setItemRetailPrice('')
        setItemStock('')
        setItemSupplyId('')
        setItemAmount('')
        setItemEmployeeId('')
        setItemModal(false)
    }
    const supplyModalFun = () => {

        setSupplyName('')
        setSupplyPhone('')
        setSupplyEmail('')
        setSupplyLocation('')
        setSupplyModal(false)
    }

    const itemModalFunBtn = () => setItemModal(true)
    const supplyModalFunBtn = () => setSupplyModal(true);



    /// Edit
    const [itemModalEdit, setItemModalEdit] = useState(false)
    const [supplyModalEdit, setSupplyModalEdit] = useState(false);

    const itemModalFunEdit = () => {

        setItemName('')
        setItemBuyingPrice('')
        setItemWholesalePrice('')
        setItemDistributorPrice('')
        setItemRetailPrice('')
        setItemStock('')
        setItemSupplyId('')
        setItemAmount('')
        setItemEmployeeId('')
        setItemModalEdit(false)
    }
    const supplyModalFunEdit = () => {
        setSupplyName('')
        setSupplyPhone('')
        setSupplyEmail('')
        setSupplyLocation('')
        setSupplyModalEdit(false)
    }

    const itemModalFunBtnEdit = () => setItemModalEdit(true)
    const supplyModalFunBtnEdit = () => setSupplyModalEdit(true);

    //// Delete 
    const [itemModalDelete, setItemModalDelete] = useState(false)
    const [supplyModalDelete, setSupplyModalDelete] = useState(false);

    const itemModalFunDelete = () => setItemModalDelete(false)
    const supplyModalFunDelete = () => setSupplyModalDelete(false);

    const itemModalFunBtnDelete = () => setItemModalDelete(true)
    const supplyModalFunBtnDelete = () => setSupplyModalDelete(true);




    ///// Suppliers
    const addSupplier = () => {

        if (Id) {
            if (supplyName && supplyPhone && supplyEmail && supplyLocation) {

                try {
                    const dbRef = ref(db, `web/pos/${Id}/suppliers/`);

                    const newbranchRef = push(dbRef, {

                        Name: supplyName,
                        Phone: supplyPhone,
                        Email: supplyEmail,
                        Location: supplyLocation

                    });
                    const newCreditKey = newbranchRef.key;

                    supplyModalFun()

                    addSuppliersuccessFun()
                }
                catch {
                    Console.log('did not add supplier')
                    supplyModalFun()
                    addSupplierFailFun()
                }
            }

            else {
                supplyModalFun()
                addSupplierFailBlankFun()
            }

        }



    };

    const [supplierEditID, setSupplierEditId] = useState()

    const supplierEditsetID = (id) => {

        supplyModalFunBtnEdit()

        setSupplierEditId(id)

    }


    const editSupplier = () => {

        if (Id) {

            if (supplyName && supplyPhone && supplyEmail && supplyLocation) {
                try {
                    const dbRef = ref(db, `web/pos/${Id}/suppliers/${supplierEditID}`);
                    const newbranchRef = update(dbRef, {

                        Name: supplyName,
                        Phone: supplyPhone,
                        Email: supplyEmail,
                        Location: supplyLocation

                    });

                    const newCreditKey = newbranchRef.key;
                    supplyModalFunEdit()
                    editSuppliersuccessFun()
                }
                catch (error) {
                    console.log(error)
                    supplyModalFunEdit()
                    editSupplierFailFun()
                }
            }
            else {
                supplyModalFunEdit()
                addSupplierFailBlankFun()
            }
        }



    };

    const [supplierdeleteID, setSupplierDeleteId] = useState()

    const supplierDeletesetID = (id) => {

        supplyModalFunBtnDelete()

        setSupplierDeleteId(id)

    }

    const deleteSupplier = () => {

        if (Id) {
            if (suppliersTotal == 1) {

                remove(ref(db, `web/pos/${Id}/suppliers`)).then(() => {

                    useUserSupplier.setState({ userSupplier: null });
                    useUserSupplierTotal.setState({ userSupplierTotal: null });
                    supplyModalFunDelete()
                    deleteSuppliersuccessFun()
                })
                    .catch((error) => {
                        supplyModalFunDelete()
                        deleteSupplierFailFun()
                    });

            } else {
                remove(ref(db, `web/pos/${Id}/suppiers/${supplierdeleteID}`)).then(() => {
                    supplyModalFunDelete()
                    deleteSuppliersuccessFun()
                })
                    .catch((error) => {
                        supplyModalFunDelete()
                        deleteSupplierFailFun()
                    });
            }

        }


    };


    /// Items
    const addItem = () => {

        if (Id) {

            if (itemName && itemBuyingPrice && itemWholesalePrice && itemDistributorPrice && itemRetailPrice && itemStock && ItemSupplyId && itemAmount) {
                try {
                    const dbRef = ref(db, `web/pos/${Id}/supplierItems/`);

                    const newbranchRef = push(dbRef, {

                        Name: itemName,
                        BuyingPrice: itemBuyingPrice,
                        WholesalePrice: itemWholesalePrice,
                        DistributorPrice: itemDistributorPrice,
                        RetailPrice: itemRetailPrice,
                        Stock: itemStock,
                        SupplierID: ItemSupplyId,
                        Total: itemAmount,
                        Date: Date.now()
                        //////make sure you check on the date 
                    });
                    const newCreditKey = newbranchRef.key;

                    itemModalFun()
                    addItemsuccessFun()
                }
                catch {
                    console.log('did not add supplier ')
                    addItemFailFun()
                }
            }
            else {
                addItemFailBlankFun()
            }
        }


    };


    const [itemdeleteID, setItemDeleteId] = useState()

    const itemDeletesetID = (id) => {

        itemModalFunBtnDelete()

        setItemDeleteId(id)

    }


    const deleteItem = () => {

        if (Id) {

            if (itemsTotal == 1) {

                remove(ref(db, `web/pos/${Id}/supplierItems`)).then(() => {

                    useUserSupplyItems.setState({ userSupplyItems: null });
                    useUserSupplierTotal.setState({ userSupplyItemsTotal: null });
                    itemModalFunDelete()
                    deleteItemsuccessFun()
                })
                    .catch((error) => {
                        itemModalFunDelete()
                        deleteItemFailFun()
                    });

            } else {
                remove(ref(db, `web/pos/${Id}/suppierItems/${itemdeleteID}`)).then(() => {
                    itemModalFunDelete()
                    deleteItemsuccessFun()
                })
                    .catch((error) => {
                        itemModalFunDelete()
                        deleteItemFailFun()
                    });
            }

        }

    };


    const [itemEditID, setItemEditId] = useState()

    const itemeditsetID = (id) => {

        itemModalFunBtnEdit()

        setItemEditId(id)

    }

    const editItem = () => {

        if (Id) {

            if (itemName && itemBuyingPrice && itemWholesalePrice && itemDistributorPrice && itemRetailPrice && itemStock && ItemSupplyId && itemAmount) {

                try {
                    const dbRef = ref(db, `web/pos/${Id}/suppliersItems/${itemEditID}`);
                    const newbranchRef = update(dbRef, {

                        Name: itemName,
                        BuyingPrice: itemBuyingPrice,
                        WholesalePrice: itemWholesalePrice,
                        DistributorPrice: itemDistributorPrice,
                        RetailPrice: itemRetailPrice,
                        Stock: itemStock,
                        SupplierID: ItemSupplyId,
                        Total: itemAmount,
                        Date: Date.now()
                        //////make sure you check on the date 

                    });
                    const newCreditKey = newbranchRef.key;
                    itemModalFun()
                    editItemsuccessFun()
                }
                catch {
                    console.log('did not edit todays item')
                    itemModalFun()
                    editItemFailFun()
                }
            }
            else {
                itemModalFun()
                addItemFailBlankFun()
            }
        }

    };

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


    //// Auto Supplier Modal
    const [addSupplierModalsuccess, setAddSuppliersuccess] = useState(false);
    const [addSupplierModalFail, setAddSupplierFail] = useState(false);
    const [addSupplierModalFailBlank, setAddSupplierFailBlank] = useState(false);

    const [editSupplierModalsuccess, setEditSuppliersuccess] = useState(false);
    const [editSupplierModalFail, setEditSupplierFail] = useState(false);

    const [deleteSupplierModalsuccess, setDeleteSuppliersuccess] = useState(false);
    const [deleteSupplierModalFail, setDeleteSupplierFail] = useState(false);

    const addSuppliersuccessFun = () => {
        setAddSuppliersuccess(true);
        setTimeout(() => setAddSuppliersuccess(false), 1500);
    };

    const addSupplierFailFun = () => {
        setAddSupplierFail(true);
        setTimeout(() => setAddSupplierFail(false), 1500);
    };

    const addSupplierFailBlankFun = () => {
        setAddSupplierFailBlank(true);
        setTimeout(() => setAddSupplierFailBlank(false), 1500);
    };


    const editSuppliersuccessFun = () => {
        setEditSuppliersuccess(true);
        setTimeout(() => setEditSuppliersuccess(false), 1500);
    };

    const editSupplierFailFun = () => {
        setEditSupplierFail(true);
        setTimeout(() => setEditSupplierFail(false), 1500);
    };


    const deleteSuppliersuccessFun = () => {
        setDeleteSuppliersuccess(true);
        setTimeout(() => setDeleteSuppliersuccess(false), 1500);
    };

    const deleteSupplierFailFun = () => {
        setDeleteSupplierFail(true);
        setTimeout(() => setDeleteSupplierFail(false), 1500);
    };


    //// Auto Items modals
    const [addItemModalsuccess, setAddItemsuccess] = useState(false);
    const [addItemModalFail, setAddItemFail] = useState(false);
    const [addItemModalFailBlank, setAddItemFailBlank] = useState(false);

    const [editItemModalsuccess, setEditItemsuccess] = useState(false);
    const [editItemModalFail, setEditItemFail] = useState(false);

    const [deleteItemModalsuccess, setDeleteItemsuccess] = useState(false);
    const [deleteItemModalFail, setDeleteItemFail] = useState(false);


    const addItemsuccessFun = () => {
        setAddItemsuccess(true);
        setTimeout(() => setAddItemsuccess(false), 1500);
    };

    const addItemFailFun = () => {
        setAddItemFail(true);
        setTimeout(() => setAddItemFail(false), 1500);
    };

    const addItemFailBlankFun = () => {
        setAddItemFailBlank(true);
        setTimeout(() => setAddItemFailBlank(false), 1500);
    };

    const editItemsuccessFun = () => {
        setEditItemsuccess(true);
        setTimeout(() => setEditItemsuccess(false), 1500);
    };

    const editItemFailFun = () => {
        setEditItemFail(true);
        setTimeout(() => setEditItemFail(false), 1500);
    };

    const deleteItemsuccessFun = () => {
        setDeleteItemsuccess(true);
        setTimeout(() => setDeleteItemsuccess(false), 1500);
    };

    const deleteItemFailFun = () => {
        setDeleteItemFail(true);
        setTimeout(() => setDeleteItemFail(false), 1500);
    };

    return (
        <div className={`min-h-screen flex flex-col 
                ${theme === "Dark"
                ? "text-white "
                : "bg-gray-200 text-black rounded-lg"
            }`}>

            {/* Main Layout */}
            <div className="flex flex-col md:flex-row flex-grow p-4 gap-4">


                <aside className="w-full md:w-2/4 xl:w-1/3 p-4 border-r shadow-xl h-auto sm:min-h-screen flex flex-col overflow-auto">

                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm sm:text-lg font-bold mr-20 ">Supplier Name</h3>
                        <button
                            className={`text-sm px-3 py-1 rounded  text-xs sm:text-base
                               ${theme === "Dark"
                                    ? "text-white  bg-green-800  hover:bg-green-600   "
                                    : "bg-green-600 text-white   hover:bg-green-800"
                                }`}
                            onClick={supplyModalFunBtn}
                        >
                            + Add Supplier
                        </button>
                    </div>


                    {/* Suppiers */}
                    <div className="grid grid-cols-1 gap-3 px-1 pt-2 overflow-y-auto"
                    >
                        {suppliers && suppliers.map((supplier, index) => (
                            <button
                                key={index}
                                style={{ borderRadius: 5 }}
                                onClick={() => handleSupplierClick(supplier.Name)}
                                className={`w-400 flex flex-row justify-between text-center p-2 rounded shadow-lg  
                                 ${theme === "Dark"
                                        ? "  border border-blue-800  "
                                        : "bg-white hover:bg-blue-200 "
                                    }`}
                            >
                                <p className="font-semibold text-xs sm:text-sm">{supplier.Name}</p>

                                <div className="flex flex-row justify-around ">
                                    <a
                                        className={` text-xs sm:text-sm py-1 px-3 mx-2 rounded   
                                          ${theme === "Dark"
                                                ? "text-white  bg-blue-800  hover:bg-blue-600   "
                                                : "bg-blue-600 text-white   hover:bg-blue-800"
                                            }`}
                                        onClick={() => supplierEditsetID(supplier.id)}
                                    >
                                        Edit
                                    </a>
                                    <a
                                        className={` py-1 text-xs sm:text-sm p px-3 rounded 
                                        
                                         ${theme === "Dark"
                                                ? "text-white  bg-red-800  hover:bg-red-600 "
                                                : "bg-red-600 text-white  hover:bg-red-800  "
                                            }`}
                                        onClick={() => supplierDeletesetID(supplier.id)}
                                    >
                                        Delete
                                    </a>

                                </div>

                            </button>
                        ))}

                        {(!suppliers || suppliers.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-24 w-full overflow-hidden">

                                {/* Logistics Rhythm Container */}
                                <div className="relative mb-12">

                                    {/* Soft Background Glow - The "Supply Chain" Aura */}
                                    <div className={`absolute inset-0 scale-[2] blur-[70px] opacity-20 animate-[pulse_5s_ease-in-out_infinite]
                ${theme === "Dark" ? "bg-blue-400" : "bg-blue-600"}`}></div>

                                    {/* Supplier Truck Icon - Horizontal "Delivery" Rhythm */}
                                    <div className="relative   animate-[truckSlide_4s_ease-in-out_infinite] group">
                                        <FaTruck
                                            className={`text-7xl transition-transform duration-500 group-hover:scale-110 
                    ${theme === "Dark" ? "text-white/90" : "text-blue-700"}`}
                                        />

                                        {/* Minimalist Accent - Trailing Speed Mark */}
                                        <div className="absolute -left-4 top-1/2 -translate-y-1/2 opacity-0 animate-[ping_2s_infinite]">
                                            <div className={`w-2 h-2 rounded-full ${theme === "Dark" ? "bg-blue-300" : "bg-blue-500"}`}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Text Section */}
                                <div className="text-center px-4 max-w-md">

                                    {/* Your Exact Wording */}
                                    <h1 className={`text-2xl sm:text-3xl font-black tracking-tight opacity-0 animate-[fadeInSlide_0.8s_ease-out_forwards]
                ${theme === "Dark" ? "text-white" : "text-gray-900"}`}>
                                        No Suppliers Added
                                    </h1>

                                    {/* The "Road" Divider */}
                                    <div className={`h-[3px] w-0 mx-auto my-5 bg-blue-500 animate-[growLine_1.2s_ease-in-out_0.4s_forwards]`}></div>

                                    <p className={`text-sm font-medium leading-relaxed opacity-0 animate-[fadeInSlide_0.8s_ease-out_0.7s_forwards]
                ${theme === "Dark" ? "text-gray-400" : "text-gray-500"}`}>
                                        Your supply network is empty. Connect with vendors to start managing your kitchen and hotel resources.
                                    </p>
                                </div>

                                {/* Custom Logistics Keyframes */}
                                <style jsx>{`
            @keyframes truckSlide {
                0%, 100% { transform: translateX(-10px); }
                50% { transform: translateX(10px); }
            }
            @keyframes fadeInSlide {
                from { opacity: 0; transform: translateY(20px); filter: blur(10px); }
                to { opacity: 1; transform: translateY(0); filter: blur(0); }
            }
            @keyframes growLine {
                from { width: 0; }
                to { width: 120px; }
            }
        `}</style>
                            </div>
                        )}

                    </div>
                </aside>
                <aside className="w-full md:w-1/4 xl:w-1/4 p-4 border-r shadow-md h-auto sm:min-h-screen flex flex-col overflow-auto">

                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm sm:text-lg font-bold ">Date </h3>
                    </div>

                    {/* Date Section */}
                    <div className="space-y-2 flex-1  overflow-y-auto max-h-[60vh]        /* 📱 mobile scroll */
    sm:max-h-none sm:overflow-visible ">
                        {filteredDates && filteredDates.map((date, index) => (
                            <button
                                key={index}
                                onClick={() => handleDateClick(date)}
                                className={`flex justify-between items-center p-1  py-3  rounded shadow-md 
                                   ${theme === "Dark"
                                        ? "  border border-blue-800  "
                                        : "bg-white hover:bg-blue-200 "
                                    }`}
                            >
                                <p className=" font-semibold text-xs sm:text-sm">{new Date(date).toLocaleDateString()}</p>
                            </button>
                        ))}


                        {(!filteredDates || filteredDates.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-20 w-full overflow-hidden animate-in fade-in duration-1000">

                                {/* --- Time-Loop Rhythm Container --- */}
                                <div className="relative mb-10">

                                    {/* Soft Background Pulse */}
                                    <div className={`absolute inset-0 scale-[2] blur-[60px] opacity-20 animate-[pulse_5s_ease-in-out_infinite]
                ${theme === "Dark" ? "bg-blue-400" : "bg-blue-600"}`}></div>

                                    {/* Rotating Orbit Ring */}
                                    <div className={`absolute inset-0 -m-4 rounded-full border-2 border-dashed opacity-10 animate-[spin_10s_linear_infinite]
                ${theme === "Dark" ? "border-white" : "border-blue-700"}`}></div>

                                    {/* Main Clock Icon - Smooth Floating + Subtle Rotation */}
                                    <div className="relative   animate-[timeFloat_4s_ease-in-out_infinite]">
                                        <FaClock
                                            className={`text-7xl transition-all duration-500 
                    ${theme === "Dark" ? "text-white/90" : "text-blue-700"}`}
                                        />

                                        {/* Secondary pulsing hand/dot */}
                                        <div className="absolute top-0 right-0">
                                            <div className={`w-3 h-3 rounded-full animate-ping ${theme === "Dark" ? "bg-blue-300" : "bg-blue-500"}`}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* --- Text Section --- */}
                                <div className="text-center px-6">

                                    {/* Your Exact Wording */}
                                    <h1 className={`text-lg sm:text-xl font-black tracking-tight opacity-0 animate-[fadeInSlide_0.8s_ease-out_forwards]
                ${theme === "Dark" ? "text-white" : "text-gray-900"}`}>
                                        Choose Supplier / No received Date
                                    </h1>

                                    {/* Growth Line Divider */}
                                    <div className={`h-[2px] w-0 mx-auto my-4 bg-blue-500 animate-[growLine_1.2s_ease-in-out_0.4s_forwards]`}></div>

                                    <p className={`text-[10px] uppercase tracking-[0.3em] font-bold opacity-0 animate-[fadeInSlide_0.8s_ease-out_0.7s_forwards]
                ${theme === "Dark" ? "text-gray-500" : "text-gray-400"}`}>
                                        Waiting for delivery history
                                    </p>
                                </div>

                                {/* --- Custom Rhythm Keyframes --- */}
                                <style jsx>{`
            @keyframes timeFloat {
                0%, 100% { transform: translateY(0px) rotate(0deg); }
                50% { transform: translateY(-15px) rotate(5deg); }
            }
            @keyframes fadeInSlide {
                from { opacity: 0; transform: translateY(15px); filter: blur(5px); }
                to { opacity: 1; transform: translateY(0); filter: blur(0); }
            }
            @keyframes growLine {
                from { width: 0; }
                to { width: 70px; }
            }
        `}</style>
                            </div>
                        )}

                    </div>
                </aside>

                {/* Item List */}

                <section className="w-full md:w-3/4 xl:w-2/4 min-h-screen flex flex-col overflow-auto">

                    <div className="flex justify-between items-center mb-1">
                        <h3 className="text-sm sm:text-lg font-bold m-5">Items </h3>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        {/* Search Bar */}
                        <button
                            className={`text-sm px-4 py-2 mx-3 rounded   text-xs sm:text-base
                             ${theme === "Dark"
                                    ? "text-white  bg-green-800  hover:bg-green-600   "
                                    : "bg-green-600 text-white   hover:bg-green-800"
                                }`}
                            onClick={itemModalFunBtn}
                        >
                            + Add Item Today
                        </button>
                        {/* Print and Download Buttons
                        
                        
                        
                         <div className="flex space-x-4">
                            <button
                                className="bg-blue-500 text-white py-2 px-4 rounded shadow hover:bg-blue-600 focus:outline-none focus:ring"
                                onClick={handlePrint}
                            >
                                Print
                            </button>
                            <button
                                className="bg-blue-500 text-white py-2 px-4 rounded shadow hover:bg-blue-600 focus:outline-none focus:ring"
                                onClick={handleDownload}
                            >
                                Download
                            </button>
                        </div>
                        */}

                    </div>

                    {/* Items Table */}
                    <div className="flex-1 overflow-y-auto ">
                        <table className="min-w-full table-auto shadow-lg rounded">
                            <thead className={` top-0
                                  ${theme === "Dark"
                                    ? "bg-blue-800 "
                                    : " bg-blue-600 text-white "
                                }`}
                            >
                                <tr>
                                    <th className={`border  px-4 py-1 text-xs sm:text-md
                                                                         ${theme === "Dark"
                                            ? "border-blue-800 "
                                            : "border-gray-300 "
                                        }`}
                                    >#</th>
                                    <th className={`border px-4 py-1 text-xs sm:text-md 
                                                                        ${theme === "Dark"
                                            ? "border-blue-800 "
                                            : "border-gray-300 "
                                        }`}>Item</th>
                                    <th className={`border  px-4 py-1  text-xs sm:text-md 
                                                                        ${theme === "Dark"
                                            ? "border-blue-800 "
                                            : "border-gray-300 "
                                        }`}>Unit</th>
                                    <th className={`border  px-4 py-1   text-xs sm:text-md 
                                                                        ${theme === "Dark"
                                            ? "border-blue-800 "
                                            : "border-gray-300 "
                                        }`}>Buying Price</th>
                                    <th className={`border  px-4 py-1   text-xs sm:text-md 
                                                                        ${theme === "Dark"
                                            ? "border-blue-800 "
                                            : "border-gray-300 "
                                        }`}>Wholesale</th>
                                    <th className={`border  px-4 py-1   text-xs sm:text-md 
                                                                        ${theme === "Dark"
                                            ? "border-blue-800 "
                                            : "border-gray-300 "
                                        }`}>Distributor</th>
                                    <th className={`border  px-4 py-1   text-xs sm:text-md 
                                                                        ${theme === "Dark"
                                            ? "border-blue-800 "
                                            : "border-gray-300 "
                                        }`}>Retail</th>
                                    <th className={`border  px-4 py-1  text-xs sm:text-md 
                                                                        ${theme === "Dark"
                                            ? "border-blue-800 "
                                            : "border-gray-300 "
                                        }`}>Total</th>
                                    <th className={`border  px-4 py-1  text-xs sm:text-md 
                                                                        ${theme === "Dark"
                                            ? "border-blue-800 "
                                            : "border-gray-300 "
                                        }`}>Actions </th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredItems && filteredItems
                                    .filter((item) => item.Name.toLowerCase().includes(searchQuery.toLowerCase())) // Filter items by search query
                                    .map((item, index) => (
                                        <tr key={item.id} className={`text-xs sm:text-sm
                                           ${theme === "Dark"
                                                ? " hover:bg-blue-100 hover:text-black   "
                                                : " bg-white border border-gray-300 hover:bg-blue-100   "
                                            }`}>
                                            <td className={`text-xs sm:text-sm px-4 py-2 text-center
                                               ${theme === "Dark"
                                                    ? "border-blue-800 "
                                                    : "border-gray-300 border"
                                                }`}>{index + 1}</td>
                                            <td className={`text-xs sm:text-sm  px-4 py-2 text-center 
                                              ${theme === "Dark"
                                                    ? "border-blue-800 "
                                                    : "border-gray-300 border"
                                                }`}>{item.Name}</td>
                                            <td className={`text-xs sm:text-sm px-4 py-2 text-center
                                               ${theme === "Dark"
                                                    ? "border-blue-800 "
                                                    : "border-gray-300 border"
                                                }`}>{item.Stock}</td>
                                            <td className={`text-xs sm:text-sm px-4 py-2 text-center
                                               ${theme === "Dark"
                                                    ? "border-blue-800 "
                                                    : "border-gray-300 border"
                                                }`}>{item.BuyingPrice}</td>
                                            <td className={`text-xs sm:text-sm px-4 py-2 text-center
                                               ${theme === "Dark"
                                                    ? "border-blue-800 "
                                                    : "border-gray-300 border"
                                                }`}>{item.WholesalePrice}</td>
                                            <td className={`text-xs sm:text-sm px-4 py-2 text-center
                                               ${theme === "Dark"
                                                    ? "border-blue-800 "
                                                    : "border-gray-300 border"
                                                }`}>{item.DistributorPrice}</td>
                                            <td className={`text-xs sm:text-sm px-4 py-2 text-center
                                               ${theme === "Dark"
                                                    ? "border-blue-800 "
                                                    : "border-gray-300 border"
                                                }`}>{item.RetailPrice}</td>
                                            <td className={`text-xs sm:text-sm px-4 py-2 text-center
                                               ${theme === "Dark"
                                                    ? "border-blue-800 "
                                                    : "border-gray-300 border"
                                                }`}>{item.Total}</td>
                                            <td className={`text-xs sm:text-sm px-4 py-2  flex flex-row justify-evenly 
                                               ${theme === "Dark"
                                                    ? "border-blue-800 "
                                                    : "border-gray-300 border"
                                                }`}>
                                                <button
                                                    className={` py-1 px-4 rounded text-xs sm:text-base
                                                
                                                      ${theme === "Dark"
                                                            ? "text-white  bg-blue-800  hover:bg-blue-600   "
                                                            : "bg-blue-600 text-white   hover:bg-blue-800"
                                                        }`}
                                                    onClick={() => itemeditsetID(item.id)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className={` py-1 px-3 rounded  text-xs sm:text-base
                                                       ${theme === "Dark"
                                                            ? "text-white  bg-red-800  hover:bg-red-600 "
                                                            : "bg-red-600 text-white  hover:bg-red-800  "
                                                        }`}
                                                    onClick={() => itemDeletesetID(item.id)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                        {(!filteredItems || filteredItems.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-24 w-full overflow-hidden animate-in fade-in duration-1000">

                                {/* --- Pulse Rhythm Container --- */}
                                <div className="relative mb-12">

                                    {/* The "Waiting" Ripples */}
                                    <div className={`absolute inset-0 scale-[2.5] blur-[80px] opacity-20 animate-[pulse_4s_ease-in-out_infinite]
                ${theme === "Dark" ? "bg-blue-400" : "bg-blue-600"}`}></div>

                                    {/* Double Ping Rings */}
                                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border animate-ping opacity-20
                ${theme === "Dark" ? "border-blue-300" : "border-blue-500"}`}></div>

                                    {/* Main Box Icon - Floating Rhythm */}
                                    <div className="relative animate-[float_3.5s_ease-in-out_infinite]">
                                        <FaBoxOpen
                                            className={`text-7xl transition-transform duration-500 
                    ${theme === "Dark" ? "text-white/90" : "text-blue-700"}`}
                                        />
                                    </div>
                                </div>

                                {/* --- Text Section --- */}
                                <div className="text-center px-6 max-w-lg">

                                    {/* Your Exact Wording */}
                                    <h1 className={`text-xl sm:text-2xl font-black tracking-tight opacity-0 animate-[fadeInSlide_0.8s_ease-out_forwards]
                ${theme === "Dark" ? "text-white" : "text-gray-900"}`}>
                                        Choose Date / No Items Recieved This Day
                                    </h1>

                                    {/* Rhythm Line */}
                                    <div className={`h-[3px] w-0 mx-auto my-5 bg-blue-500 animate-[growLine_1.2s_ease-in-out_0.4s_forwards]`}></div>

                                    <p className={`text-[10px] uppercase tracking-[0.4em] font-bold opacity-0 animate-[fadeInSlide_0.8s_ease-out_0.7s_forwards]
                ${theme === "Dark" ? "text-gray-500" : "text-gray-400"}`}>
                                        Awaiting chronological data
                                    </p>
                                </div>

                                {/* --- Custom Rhythm Keyframes --- */}
                                <style jsx>{`
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-20px); }
            }
            @keyframes fadeInSlide {
                from { opacity: 0; transform: translateY(15px); filter: blur(8px); }
                to { opacity: 1; transform: translateY(0); filter: blur(0); }
            }
            @keyframes growLine {
                from { width: 0; }
                to { width: 100px; }
            }
        `}</style>
                            </div>
                        )}

                    </div>
                </section>
            </div>


            {/** Add Supplier*/}

            {supplyModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className={` p-6 rounded-xl shadow w-96  mx-4
                        ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white "
                        }`
                    }>
                        <h2 className="text-md sm:text-lg font-bold mb-4 text-center">Add Supplier</h2>


                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Name"
                                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={supplyName}
                                    onChange={(e) => setSupplyName(e.target.value)}
                                />
                                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>

                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="Email"
                                    className=" p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={supplyEmail}
                                    onChange={(e) => setSupplyEmail(e.target.value)}
                                />
                                <MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />

                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Phone"
                                    className=" p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={supplyPhone}
                                    onChange={(e) => setSupplyPhone(e.target.value)}
                                />
                                <FaPhoneAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>


                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Location"
                                    className=" p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={supplyLocation}
                                    onChange={(e) => setSupplyLocation(e.target.value)}
                                />
                                <MdLocationCity className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>

                        </div>

                        <div className=" flex flex-row justify-evenly mt-1">
                            <button
                                className={` text-white px-4 py-2 rounded  mt-4  text-xs sm:text-base
                                
                              ${theme === "Dark"
                                        ? "bg-green-800  hover:bg-green-600"
                                        : "bg-green-600  hover:bg-green-800 "
                                    }`}
                                onClick={addSupplier}
                            >
                                Add
                            </button>
                            <button
                                className={` text-white px-4 py-2 rounded mt-4 text-xs sm:text-base
                                  ${theme === "Dark"
                                        ? "bg-red-800  hover:bg-red-600"
                                        : "bg-red-600  hover:bg-red-800 "
                                    }`}
                                onClick={supplyModalFun}
                            >
                                Cancel
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/** Edit Supplier*/}
            {supplyModalEdit && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className={` p-6 rounded-xl shadow w-96  mx-4
                        ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white "
                        }`
                    }>
                        <h2 className=" text-md sm:text-lg font-bold mb-4 text-center">Edit Supplier</h2>


                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Name"
                                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={supplyName}
                                    onChange={(e) => setSupplyName(e.target.value)}
                                />
                                <FaUser className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>

                            <div className="relative">
                                <input
                                    type="email"
                                    placeholder="Email"
                                    className=" p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={supplyEmail}
                                    onChange={(e) => setSupplyEmail(e.target.value)}
                                />
                                < MdEmail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />

                            </div>
                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Phone"
                                    className=" p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={supplyPhone}
                                    onChange={(e) => setSupplyPhone(e.target.value)}
                                />
                                <FaPhoneAlt className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>


                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Location"
                                    className=" p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={supplyLocation}
                                    onChange={(e) => setSupplyLocation(e.target.value)}
                                />
                                <MdLocationCity className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>

                        </div>

                        <div className=" flex flex-row justify-evenly">
                            <button
                                className={` text-white px-4 py-2 rounded  mt-4  text-xs sm:text-base
                                
                              ${theme === "Dark"
                                        ? "bg-green-800  hover:bg-green-600"
                                        : "bg-green-600  hover:bg-green-800 "
                                    }`}
                                onClick={editSupplier}
                            >
                                Edit
                            </button>
                            <button
                                className={` text-white px-4 py-2 rounded mt-4 text-xs sm:text-base
                                  ${theme === "Dark"
                                        ? "bg-red-800  hover:bg-red-600"
                                        : "bg-red-600  hover:bg-red-800 "
                                    }`}
                                onClick={supplyModalFunEdit}
                            >
                                Cancel
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/** Delete Supplier*/}
            {supplyModalDelete && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className={` p-6 rounded-xl shadow w-96  mx-4
                        ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white "
                        }`
                    }>
                        <h2 className="text-md sm:text-lg font-bold mb-4 text-center">Delete Supplier</h2>

                        <div className="mt-4 font-semibold text-sm sm:text-md">
                            Are you sure you want to delete this Supplier?
                        </div>

                        <div className=" flex flex-row justify-evenly">
                            <button
                                className={` text-white px-4 py-2 rounded  mt-4   text-xs sm:text-base
                                
                              ${theme === "Dark"
                                        ? "bg-green-800  hover:bg-green-600"
                                        : "bg-green-600  hover:bg-green-800 "
                                    }`}
                                onClick={deleteSupplier}
                            >
                                Ok
                            </button>
                            <button
                                className={` text-white px-4 py-2 rounded mt-4 text-xs sm:textbase
                                  ${theme === "Dark"
                                        ? "bg-red-800  hover:bg-red-600"
                                        : "bg-red-600  hover:bg-red-800 "
                                    }`}
                                onClick={supplyModalFunDelete}
                            >
                                Cancel
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/**Add Item */}

            {itemModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className={` p-6 rounded-xl shadow w-96 max-h-[90vh] overflow-y-auto mx-4
                        ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white "
                        }`
                    }>
                        <h2 className="text-sm sm:text-lg font-bold mb-4 text-center">Add Item</h2>

                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Item Name"
                                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                />
                                <FaTags className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>

                            <div className="relative">


                                <select
                                    className="border p-3 rounded my -3 shadow text-black text-sm sm:text-base"
                                    value={ItemSupplyId}
                                    onChange={(e) => setItemSupplyId(e.target.value)}
                                >
                                    <option value="" disabled>
                                        -- Select Supplier --
                                    </option>
                                    {suppliers &&
                                        suppliers.map((supplier) => (
                                            <option key={supplier.id} value={supplier.Name}>
                                                {supplier.Name}
                                            </option>
                                        ))}
                                </select>

                            </div>

                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Buying Price (cost from supplier)"
                                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={itemBuyingPrice}
                                    onChange={(e) => setItemBuyingPrice(e.target.value)}
                                />
                                <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>

                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Wholesale Price"
                                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={itemWholesalePrice}
                                    onChange={(e) => setItemWholesalePrice(e.target.value)}
                                />
                                <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>

                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Distributor Price"
                                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={itemDistributorPrice}
                                    onChange={(e) => setItemDistributorPrice(e.target.value)}
                                />
                                <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>

                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Retail Price"
                                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={itemRetailPrice}
                                    onChange={(e) => setItemRetailPrice(e.target.value)}
                                />
                                <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>

                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Stock Received"
                                    className=" p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={itemStock}
                                    onChange={(e) => setItemStock(e.target.value)}
                                />
                                <FaBoxOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>

                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Total Amount "
                                    className=" w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={itemAmount}
                                    onChange={(e) => setItemAmount(e.target.value)}
                                />
                                <FaMoneyBill className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>

                        </div>


                        <div className=" flex flex-row justify-evenly mt-1">
                            <button
                                className={` text-white px-4 py-2 rounded  mt-4  text-xs sm:text-base
                                
                              ${theme === "Dark"
                                        ? "bg-green-800  hover:bg-green-600"
                                        : "bg-green-600  hover:bg-green-800 "
                                    }`}
                                onClick={addItem}
                            >
                                Add
                            </button>
                            <button
                                className={` text-white px-4 py-2 rounded mt-4 text-xs sm:text-base
                                  ${theme === "Dark"
                                        ? "bg-red-800  hover:bg-red-600"
                                        : "bg-red-600  hover:bg-red-800 "
                                    }`}
                                onClick={itemModalFun}
                            >
                                Cancel
                            </button>
                        </div>

                    </div>
                </div>
            )}


            {/**Edit Item */}
            {itemModalEdit && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-10">
                    <div className={` p-6 rounded-xl shadow w-96 max-h-[90vh] overflow-y-auto mx-4
                        ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white "
                        }`
                    }>
                        <h2 className=" text-md sm:text-lg font-bold mb-4 text-center">Edit Item</h2>


                        <div className="space-y-3">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Item Name"
                                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={itemName}
                                    onChange={(e) => setItemName(e.target.value)}
                                />
                                <FaTags className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>

                            <div className="relative">


                                <select
                                    className="border p-3 rounded my -3 shadow text-black text-sm sm:text-base"
                                    value={ItemSupplyId}
                                    onChange={(e) => setItemSupplyId(e.target.value)}
                                >
                                    <option value="" disabled>
                                        -- Select Supplier --
                                    </option>
                                    {suppliers &&
                                        suppliers.map((supplier) => (
                                            <option key={supplier.id} value={supplier.Name}>
                                                {supplier.Name}
                                            </option>
                                        ))}
                                </select>

                            </div>

                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Buying Price (cost from supplier)"
                                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={itemBuyingPrice}
                                    onChange={(e) => setItemBuyingPrice(e.target.value)}
                                />
                                <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>

                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Wholesale Price"
                                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={itemWholesalePrice}
                                    onChange={(e) => setItemWholesalePrice(e.target.value)}
                                />
                                <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>

                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Distributor Price"
                                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={itemDistributorPrice}
                                    onChange={(e) => setItemDistributorPrice(e.target.value)}
                                />
                                <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>

                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Retail Price"
                                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={itemRetailPrice}
                                    onChange={(e) => setItemRetailPrice(e.target.value)}
                                />
                                <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>

                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Stock Received"
                                    className=" p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={itemStock}
                                    onChange={(e) => setItemStock(e.target.value)}
                                />
                                <FaBoxOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>

                            <div className="relative">
                                <input
                                    type="number"
                                    placeholder="Total Amount "
                                    className=" w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-2 focus:ring-[#303133]  pl-12 shadow-md text-sm sm:text-base"
                                    style={{ color: "#000000" }}
                                    value={itemAmount}
                                    onChange={(e) => setItemAmount(e.target.value)}
                                />
                                <FaMoneyBill className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-xl" />
                            </div>

                        </div>


                        <div className=" flex flex-row justify-evenly">
                            <button
                                className={` text-white px-4 py-2 rounded  mt-4  text-xs sm:text-base
                                
                              ${theme === "Dark"
                                        ? "bg-green-800  hover:bg-green-600"
                                        : "bg-green-600  hover:bg-green-800 "
                                    }`}
                                onClick={editItem}
                            >
                                Edit
                            </button>
                            <button
                                className={` text-white px-4 py-2 rounded mt-4 text-xs sm:text-base
                                  ${theme === "Dark"
                                        ? "bg-red-800  hover:bg-red-600"
                                        : "bg-red-600  hover:bg-red-800 "
                                    }`}
                                onClick={itemModalFunEdit}
                            >
                                Cancel
                            </button>
                        </div>

                    </div>
                </div>
            )}


            {/**delete Item */}
            {itemModalDelete && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-10">
                    <div className={` p-6 rounded-xl shadow w-96 mx-4
                        ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white "
                        }`
                    }>
                        <h2 className="text-md sm:text-lg font-bold mb-4 text-center">Delete Item</h2>

                        <div className="mt-4 font-semibold text-sm sm:text-md">
                            Are you sure you want to delete this item?
                        </div>

                        <div className=" flex flex-row justify-evenly">
                            <button
                                className={` text-white px-4 py-2 rounded  mt-4 text-xs sm:text-base
                                
                              ${theme === "Dark"
                                        ? "bg-green-800  hover:bg-green-600"
                                        : "bg-green-600  hover:bg-green-800 "
                                    }`}
                                onClick={deleteItem}
                            >
                                Ok
                            </button>
                            <button
                                className={` text-white px-4 py-2 rounded mt-4 text-xs sm:text-base
                                  ${theme === "Dark"
                                        ? "bg-red-800  hover:bg-red-600"
                                        : "bg-red-600  hover:bg-red-800 "
                                    }`}
                                onClick={itemModalFunDelete}
                            >
                                Cancel
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* Auto-Close Modals */}
            {addSupplierModalsuccess && (
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
                        <p>The Supplier was Added</p>
                    </div>
                </div>
            )}

            {addSupplierModalFail && (
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
                        <p>The Supplier was not Added</p>
                    </div>
                </div>
            )}


            {addSupplierModalFailBlank && (
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


            {editSupplierModalsuccess && (
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
                        <p>The Supplier was Edited</p>
                    </div>
                </div>
            )}

            {editSupplierModalFail && (
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
                        <p>The Supplier was not Edited</p>
                    </div>
                </div>
            )}

            {deleteSupplierModalsuccess && (
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
                        <p>The Supplier was Deleted</p>
                    </div>
                </div>
            )}

            {deleteSupplierModalFail && (
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
                        <p>The Supplier was not Deleted</p>
                    </div>
                </div>
            )}


            {/**items auto modal */}
            {addItemModalsuccess && (
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
                        <p>The Items was Added</p>
                    </div>
                </div>
            )}

            {addItemModalFail && (
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
                        <p>The Item was not Added</p>
                    </div>
                </div>
            )}

            {addItemModalFailBlank && (
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

            {editItemModalsuccess && (
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
                        <p>The Item was Edited</p>
                    </div>
                </div>
            )}

            {editItemModalFail && (
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
                        <p>The Item was not Edited</p>
                    </div>
                </div>
            )}

            {deleteItemModalsuccess && (
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
                        <p>The Item was Deleted</p>
                    </div>
                </div>
            )}

            {deleteItemModalFail && (
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
                        <p>The Item was not Deleted</p>
                    </div>
                </div>
            )}


        </div>
    );
}

export default Suppliers 
