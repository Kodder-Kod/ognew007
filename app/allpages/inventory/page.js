"use client"

import { ref, update, push, remove, set } from 'firebase/database';
import { db } from "../../../config";
import { MdEmail } from "react-icons/md"
import { GiPadlock } from "react-icons/gi";
import { GiDialPadlock } from "react-icons/gi";
import { FaBoxOpen, FaBox, FaDollarSign, FaPhoneAlt, FaSearch, FaTag, FaTags } from "react-icons/fa";
import { useEffect, useState } from "react";
import { FaUser, FaTerminal, FaClock } from "react-icons/fa";
import { useUserItems, useUserItemsTotal } from '@/app/componets/zustand/items';
import { useUserCategories, useUserCategoriesTotal } from '@/app/componets/zustand/categories';
import { useUserAccountName, useUserID, useUserName } from '@/app/componets/zustand/profile';
import { TbXboxX } from "react-icons/tb";
import { TiTick } from "react-icons/ti";
import itemsdata from "@/app/data/items";
import categoriesdata from "@/app/data/categories";
import { useUserTheme } from '@/app/componets/zustand/theme';
import { CiBarcode } from "react-icons/ci";
import { CgCommunity } from "react-icons/cg";
import { FaBan, FaHashtag } from "react-icons/fa";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";



const Inventory = () => {

    // Zustand
    const Id = useUserID((state) => state.userID)
    const categoriesState = useUserCategories((state) => state.userCategories);
    const categories = Array.isArray(categoriesState) ? categoriesState : [];
    const categoriesTotal = useUserCategoriesTotal((state) => state.userCategoriesTotal)
    const items = useUserItems((state) => state.userItems)
    const itemsTotal = useUserItemsTotal((state) => state.userItemsTotal)
    const theme = useUserTheme((state) => state.userTheme)
    const userAccountName = useUserAccountName((state) => state.userAccountName)
    const bizName = useUserName((state) => state.userName)


    /// for input N/A or number in stock 
    const [stockType, setStockType] = useState("number");

    /// for edit  and stock
    const [oldItem, setOldItem] = useState({});

    ///General variables
    const [searchQuery, setSearchQuery] = useState("");
    // Add this line at the top of your component function
    const [activeCategory, setActiveCategory] = useState("All");

    // Add this logic before the 'return' statement in your component function

    // 1. Apply the search filter first (using your existing logic)
    const searchableItems = items && items.filter((item) =>
        item.Name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // 2. Apply the category filter
    const filteredItems = searchableItems
        ? searchableItems.filter((item) =>
            activeCategory === 'All' ? true : item.Category === activeCategory
        )
        : null;


    /// Modals
    // Add 
    const [itemName, setItemName] = useState('')
    const [itemPrice, setItemPrice] = useState('')
    const [itemBuyingPrice, setItemBuyingPrice] = useState('')
    const [itemUnit, setItemUnit] = useState('')
    const [itemCode, setItemCode] = useState('')
    const [itemStock, setItemStock] = useState('')
    const [ItemCategory, setItemCategory] = useState('')

    const [catName, setCatName] = useState('')


    const [itemModal, setItemModal] = useState(false)
    const [catModal, setCatModal] = useState(false);

    const itemModalFun = () => {
        setItemName('')
        setItemPrice('')
        setItemStock('')
        setItemCode('')
        setItemUnit('')
        setItemCategory('')
        setItemBuyingPrice('')
        setItemModal(false)
    }
    const catModalFun = () => {
        setCatName('')
        setCatModal(false);
    }

    const itemModalFunBtn = () => setItemModal(true)
    const catModalFunBtn = () => setCatModal(true);


    //// Stock

    const [itemModalStock, setItemModalStock] = useState(false)

    const itemModalFunStock = () => {
        setItemName('')
        setItemPrice('')
        setItemStock('')
        setItemCode('')
        setItemUnit('')
        setItemCategory('')
        setItemModalStock(false)

    }

    const itemModalFunBtnStock = () => setItemModalStock(true)

    /// Edit
    const [itemModalEdit, setItemModalEdit] = useState(false)
    const [catModalEdit, setCatModalEdit] = useState(false);

    const itemModalFunEdit = () => {
        setItemName('')
        setItemBuyingPrice('')
        setItemPrice('')
        setItemStock('')
        setItemCode('')
        setItemUnit('')
        setItemCategory('')
        setItemModalEdit(false)

    }
    const catModalFunEdit = () => {
        setCatName('')
        setCatModalEdit(false);
    }

    const itemModalFunBtnEdit = () => setItemModalEdit(true)
    const catModalFunBtnEdit = () => setCatModalEdit(true);

    //// Delete 
    const [itemModalDelete, setItemModalDelete] = useState(false)
    const [catModalDelete, setCatModalDelete] = useState(false);

    const itemModalFunDelete = () => setItemModalDelete(false)
    const catModalFunDelete = () => setCatModalDelete(false);

    const itemModalFunBtnDelete = () => setItemModalDelete(true)
    const catModalFunBtnDelete = () => setCatModalDelete(true);


    ///// Category operations
    const addCategory = () => {

        if (Id) {

            if (catName) {
                try {
                    const dbRef = ref(db, `web/pos/${Id}/categories/`);

                    const newbranchRef = push(dbRef, {

                        Name: catName,

                    });
                    const newCreditKey = newbranchRef.key;

                    catModalFun()
                    addCatsuccessFun()
                }
                catch {
                    console.log('did not add category')
                    catModalFunEdit()
                    addCatFailFun()
                }
            }
            else {
                catModalFunEdit()
                addCatFailBlankFun()
            }

        }

    };


    const [catDeleteID, setCatDeleteId] = useState()

    const catDeletesetID = (id) => {

        catModalFunBtnDelete()

        setCatDeleteId(id)
    }

    const deleteCategory = () => {

        if (Id) {

            if (categoriesTotal == 1) {

                remove(ref(db, `web/pos/${Id}/categories`)).then(() => {

                    useUserCategories.setState({ userCategories: null });
                    useUserCategoriesTotal.setState({ userCategoriesTotal: null });
                    catModalFunDelete()
                    deleteCatsuccessFun()

                })
                    .catch((error) => {
                        catModalFunDelete()
                        deleteCatFailFun()
                    });

            } else {
                remove(ref(db, `web/pos/${Id}/categories/${catDeleteID}`)).then(() => {
                    catModalFunDelete()
                    deleteCatsuccessFun()
                })
                    .catch((error) => {
                        catModalFunDelete()
                        deleteCatFailFun()
                    });
            }
        }
    };

    const [catEditID, setCatEditId] = useState()

    const catEditsetID = (id, jina) => {

        catModalFunBtnEdit()
        setCatEditId(id)
        setCatName(jina)
    }

    const editCategories = (id) => {

        if (Id) {

            if (catName) {

                try {
                    const dbRef = ref(db, `web/pos/${Id}/categories/${catEditID}`);
                    const newbranchRef = update(dbRef, {

                        Name: catName,

                    });

                    const newCreditKey = newbranchRef.key;

                    catModalFunEdit()
                    editCatsuccessFun()

                }
                catch {
                    console.log('did not edit category')
                    catModalFunEdit()
                    editCatFailFun()
                }
            }
            else {
                catModalFunEdit()
                addCatFailBlankFun()

            }

        }

    };

    ////// Handlers for item operations
    const addItem = async () => {
        if (!Id) return;

        if (itemName && ItemCategory) {
            try {
                // Reference to items
                const dbRef = ref(db, `web/pos/${Id}/items/`);

                // Push new item
                const newItemRef = push(dbRef, {
                    Name: itemName,
                    Price: itemPrice,
                    BuyingPrice: itemBuyingPrice,
                    Stock: itemStock,
                    Category: ItemCategory,
                    Unit: itemUnit,
                    Code: itemCode,
                });

                const newItemKey = newItemRef.key;

                // --- Log the addition ---
                const logRef = ref(db, `web/pos/${Id}/edit`);
                const newLogRef = push(logRef);
                await set(newLogRef, {
                    type: "add",
                    itemName: itemName,
                    itemId: newItemKey,
                    editedBy: userAccountName,
                    timestamp: Date.now(),
                    details: {
                        Name: itemName,
                        Price: itemPrice,
                        Stock: itemStock,
                        Category: ItemCategory,

                    }
                });

                // UI feedback
                itemModalFun();
                addItemsuccessFun();

            } catch (error) {
                console.log("did not add item", error);
                itemModalFun();
                addItemFailFun();
            }
        } else {
            itemModalFun();
            addItemFailBlankFun();
        }
    };


    const [itemdeleteID, setItemDeleteId] = useState()
    const [itemdeleteName, setItemDeleteName] = useState()

    const itemDeletesetID = (id, jina) => {

        itemModalFunBtnDelete()
        setItemDeleteId(id)
        setItemDeleteName(jina)
    }

    const deleteItem = async () => {
        if (!Id) return;

        try {
            // Save log first
            const logRef = ref(db, `web/pos/${Id}/edit`);
            const newLogRef = push(logRef);
            await set(newLogRef, {
                type: "delete",
                itemName: itemdeleteName,
                deletedBy: userAccountName,
                timestamp: Date.now(),
            });

            // Now delete the item
            if (itemsTotal === 1) {
                await remove(ref(db, `web/pos/${Id}/items`));
                useUserItems.setState({ userItems: null });
                useUserItemsTotal.setState({ userItemsTotal: null });
            } else {
                await remove(ref(db, `web/pos/${Id}/items/${itemdeleteID}`));
            }

            itemModalFunDelete();
            deleteItemsuccessFun();

        } catch (error) {
            console.log("did not delete item", error);
            itemModalFunDelete();
            deleteItemFailFun();
        }
    };


    const [itemEditID, setItemEditId] = useState()

    const itemEditsetID = (id, jina, stock, bp, price, category, unit, code) => {

        itemModalFunBtnEdit();

        setItemEditId(id);

        // store old values CLEANLY
        setOldItem({
            Name: jina,
            BuyingPrice: bp,
            Price: price,
            Stock: stock,
            Category: category,
            Unit: unit,
            Code: code,
        });

        // store new values for editing
        setItemName(jina);
        setItemPrice(price);
        setItemBuyingPrice(bp);
        setItemStock(stock);
        setItemCode(code);
        setItemUnit(unit);
        setItemCategory(category);
    };

    /// stock

    const itemStocksetID = (id, jina, stock, bp, price, category, unit, code) => {

        itemModalFunBtnStock();

        setItemEditId(id);

        // store old values CLEANLY
        setOldItem({
            Name: jina,
            BuyingPrice: bp,
            Price: price,
            Stock: stock,
            Category: category,
            Unit: unit,
            Code: code,
        });

        // store new values for editing
        setItemName(jina);
        setItemPrice(price);
        setItemBuyingPrice(bp);
        setItemStock(stock);
        setItemCode(code);
        setItemUnit(unit);
        setItemCategory(category);
    };


    const [changeDetails, setChangeDetails] = useState([]);


    const getChangedDetails = () => {
        let changes = [];

        if (oldItem.Name !== itemName) {
            changes.push(`Name changed from "${oldItem.Name}" → "${itemName}"`);
        }

        if (oldItem.Category !== ItemCategory) {
            changes.push(`Category changed from "${oldItem.Category}" → "${ItemCategory}"`);
        }

        if (oldItem.Price !== itemPrice) {
            const diff = itemPrice - oldItem.Price;
            const diffText = diff > 0 ? `increased by ${diff}` : `decreased by ${Math.abs(diff)}`;
            changes.push(`Price changed: ${oldItem.Price} → ${itemPrice} (${diffText})`);
        }

        if (oldItem.Stock !== itemStock) {
            const diff = itemStock - oldItem.Stock;
            const diffText = diff > 0 ? `increased by ${diff}` : `decreased by ${Math.abs(diff)}`;
            changes.push(`Stock changed: ${oldItem.Stock} → ${itemStock} (${diffText})`);
        }

        return changes;
    };


    const editItem = async () => {
        if (!Id) return;

        try {
            const dbRef = ref(db, `web/pos/${Id}/items/${itemEditID}`);
            await update(dbRef, {
                Name: itemName,
                BuyingPrice: itemBuyingPrice,
                Price: itemPrice,
                Stock: itemStock,
                Unit: itemUnit,
                Code: itemCode,
                Category: ItemCategory,
            });

            // Get changes
            const changes = getChangedDetails();
            setChangeDetails(changes);

            // Save log
            const logRef = ref(db, `web/pos/${Id}/edit`);
            const newLogRef = push(logRef); // generates unique key
            await set(newLogRef, {
                type: "edit",
                itemName: itemName,
                changes: changes,
                editedBy: userAccountName,
                timestamp: Date.now(),
            });

            itemModalFunEdit();
            itemModalFunStock();
            editItemsuccessFun();

        } catch (error) {
            console.log("did not edit item", error);
            itemModalFunEdit();
            itemModalFunStock();
            editItemFailFun();
        }
    };


    // Print the items table
    const handlePrint = () => {
        window.print();
    };

    // Download the currently visible items as CSV
    const handleDownloadExcel = () => {
        const visibleItems = sortedItems.filter(item =>
            item.Name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (visibleItems.length === 0) {
            alert("No items to download");
            return;
        }

        const delimiter = ",";
        const now = new Date();
        const generatedDate = now.toLocaleDateString();
        const generatedTime = now.toLocaleTimeString();


        // 🔹 Styled header section
        const titleRow = [`ITEMS INVENTORY REPORT - ${generatedDate}`];
        const separatorRow = ["=============================="];
        const businessRow = [`Business Name: ${bizName || "N/A"}`];
        const categoryRow = [
            `Category: ${activeCategory && activeCategory !== "All"
                ? activeCategory
                : "All Items"}`
        ];
        const dateRow = [`Generated On: ${generatedDate} at ${generatedTime}`];
        const generatedByRow = [`Generated By: ${userAccountName}`];
        const emptyRow = [];

        // 🔹 Table headers
        const headers = ["#", "Name", "Category", "Stock", "Price"];

        // 🔹 Data rows (Stock defaults to 0 if blank)
        const rows = visibleItems.map((item, index) => [
            index + 1,
            item.Name || "",
            item.Category || "",
            item.Stock !== "" && item.Stock != null ? item.Stock : 0, // Stock default 0
            item.Price || ""
        ]);

        const csvArray = [
            titleRow,
            separatorRow,
            businessRow,
            categoryRow,
            dateRow,
            generatedByRow,
            emptyRow,
            headers,
            ...rows
        ];

        const csvString = csvArray.map(row => row.join(delimiter)).join("\n");

        const BOM = "\ufeff";
        const blob = new Blob([BOM + csvString], {
            type: "text/csv;charset=utf-8;"
        });

        const url = URL.createObjectURL(blob);

        const link = document.createElement("a");
        link.href = url;
        link.download = `items_inventory_${generatedDate}.csv`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    const handleDownloadPDF = () => {
        const visibleItems = sortedItems.filter(item =>
            item.Name.toLowerCase().includes(searchQuery.toLowerCase())
        );

        if (visibleItems.length === 0) {
            alert("No items to download");
            return;
        }

        const doc = new jsPDF();
        const now = new Date();
        const generatedDate = now.toLocaleDateString();
        const generatedTime = now.toLocaleTimeString();

        // 🔹 Report Title with date
        doc.setFontSize(16);
        doc.setFont("helvetica", "bold");
        doc.text(`ITEMS INVENTORY REPORT - ${generatedDate}`, 14, 15);

        // Divider
        doc.setLineWidth(0.5);
        doc.line(14, 18, 196, 18);

        // 🔹 Meta details
        doc.setFontSize(10);
        doc.setFont("helvetica", "normal");

        doc.text(`Business Name: ${bizName || "N/A"}`, 14, 26);
        doc.text(
            `Category: ${activeCategory && activeCategory !== "All" ? activeCategory : "All Items"}`,
            14,
            32
        );
        doc.text(`Generated On: ${generatedDate} at ${generatedTime}`, 14, 38);
        doc.text(`Generated By: ${userAccountName}`, 14, 44);

        const tableColumn = ["#", "Name", "Category", "Stock", "Price"];
        const tableRows = visibleItems.map((item, index) => [
            index + 1,
            item.Name || "",
            item.Category || "",
            item.Stock !== "" && item.Stock != null ? item.Stock : 0, // Stock defaults to 0
            item.Price || ""
        ]);

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 50, // adjusted to make space for the new line

            styles: {
                fontSize: 8,
                cellPadding: 2
            },

            headStyles: {
                fillColor: [41, 128, 185],
                fontSize: 9,
                textColor: 255
            },

            margin: { left: 10, right: 10 }
        });

        doc.save(`items_inventory_${generatedDate}.pdf`);
    };

    //// Auto Categories Modal
    const [addCatModalsuccess, setAddCatsuccess] = useState(false);
    const [addCatModalFail, setAddCatFail] = useState(false);
    const [addCatModalFailBlank, setAddCatFailBlank] = useState(false);

    const [editCatModalsuccess, setEditCatsuccess] = useState(false);
    const [editCatModalFail, setEditCatFail] = useState(false);

    const [deleteCatModalsuccess, setDeleteCatsuccess] = useState(false);
    const [deleteCatModalFail, setDeleteCatFail] = useState(false);

    const addCatsuccessFun = () => {
        setAddCatsuccess(true);
        setTimeout(() => setAddCatsuccess(false), 1500);
    };

    const addCatFailFun = () => {
        setAddCatFail(true);
        setTimeout(() => setAddCatFail(false), 1500);
    };

    const addCatFailBlankFun = () => {
        setAddCatFailBlank(true);
        setTimeout(() => setAddCatFailBlank(false), 1500);
    };

    const editCatsuccessFun = () => {
        setEditCatsuccess(true);
        setTimeout(() => setEditCatsuccess(false), 1500);
    };

    const editCatFailFun = () => {
        setEditCatFail(true);
        setTimeout(() => setEditCatFail(false), 1500);
    };

    const deleteCatsuccessFun = () => {
        setDeleteCatsuccess(true);
        setTimeout(() => setDeleteCatsuccess(false), 1500);
    };

    const deleteCatFailFun = () => {
        setDeleteCatFail(true);
        setTimeout(() => setDeleteCatFail(false), 1500);
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

    const [sortConfig, setSortConfig] = useState({ key: "Name", direction: "asc" });

    const handleSort = (key) => {
        let direction = "asc";
        if (sortConfig.key === key && sortConfig.direction === "asc") {
            direction = "desc";
        }
        setSortConfig({ key, direction });
    };

    const safeFilteredItems = Array.isArray(filteredItems)
        ? filteredItems
        : [];

    const sortedItems = [...safeFilteredItems].sort((a, b) => {
        if (!sortConfig.key) return 0;

        const key = sortConfig.key;
        let valueA = a[key];
        let valueB = b[key];

        const isNumeric =
            !isNaN(parseFloat(valueA)) &&
            !isNaN(parseFloat(valueB));

        if (isNumeric) {
            valueA = Number(valueA);
            valueB = Number(valueB);
        } else {
            valueA = (valueA ?? "").toString().toLowerCase();
            valueB = (valueB ?? "").toString().toLowerCase();
        }

        return sortConfig.direction === "asc"
            ? valueA > valueB ? 1 : -1
            : valueA < valueB ? 1 : -1;
    });

    //// select pdf or excel
    const [open, setOpen] = useState(false);


    return (
        <div className={`min-h-screen flex flex-col 
          ${theme === "Dark"
                ? "text-white "
                : "bg-gray-200 text-black rounded-lg"
            }`} >

            {/* Main Layout */}
            <div className="flex flex-col lg:flex-row flex-grow rounded-xl">

                {/* Categories Management */}
                <aside className="w-full lg:w-1/4 p-4 sm:p-6 shadow-xl flex flex-col h-auto sm:h-auto lg:h-auto my-2 sm:my-0 rounded-xl">

                    <div className="flex justify-between items-center mb-3">
                        <h3 className=" text-sm sm:text-lg font-bold ">Manage Categories</h3>
                        <button
                            className={`text-xs sm:text-sm px-3 sm:m-0 m-1 py-1 rounded ${theme === "Dark"
                                ? "text-white bg-green-800 hover:bg-green-600"
                                : "bg-green-600 text-white hover:bg-green-800"
                                }`}
                            onClick={catModalFunBtn}
                        >
                            + Add Category
                        </button>
                    </div>

                    {/* Scrollable Categories Section */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-1 gap-1 px-5 sm:px-10 pt-1 overflow-y-auto">
                        {categories && categories.map((category, index) => (
                            <div
                                key={index}
                                className={`shadow-lg text-center p-3 sm:p-4 rounded-xl sm:my-1 
            ${theme === "Dark" ? "border border-blue-800" : "bg-white hover:bg-blue-200"}`}
                            >
                                <p className="font-semibold text-sm sm:text-md">{category.Name}</p>
                                <button
                                    className={`py-1 px-2 mt-2 mx-2 rounded  text-xs sm:text-sm ${theme === "Dark"
                                        ? "text-white bg-blue-800 hover:bg-blue-600"
                                        : "bg-blue-600 text-white hover:bg-blue-800"
                                        }`}
                                    onClick={() => catEditsetID(category.id, category.Name)}
                                >
                                    Edit
                                </button>
                                <button
                                    className={`px-2 py-1 mx-2 mt-2 rounded text-xs sm:text-sm  ${theme === "Dark"
                                        ? "text-white bg-red-800 hover:bg-red-600"
                                        : "bg-red-600 text-white hover:bg-red-800"
                                        }`}
                                    onClick={() => catDeletesetID(category.id)}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}

                        {!categories || categories.length == 0 && (
                            <div className="flex flex-col items-center justify-center py-12 animate-in fade-in duration-700">
                                {/* Animated Icon Container */}
                                <div className="relative group">
                                    {/* Soft Glow Background Pulse */}
                                    <div className={`absolute inset-0 blur-2xl opacity-20 rounded-full animate-pulse 
                                    ${theme === "Dark" ? "bg-blue-400" : "bg-blue-600"}`}></div>

                                    {/* Floating Icon */}
                                    <div className="relative justify-center flex sm:mt-20 animate-[bounce_3s_infinite] transition-transform duration-500 group-hover:scale-110">
                                        <FaTags className={`text-7xl transition-all duration-500 hover:scale-110 
          ${theme === "Dark" ? "text-white" : "text-blue-700"}`} />
                                    </div>
                                </div>

                                {/* Animated Text */}
                                <div className="flex flex-col items-center animate-[slideUp_0.8s_ease-out]">
                                    <h1 className={`text-lg sm:text-xl font-bold tracking-tight mt-4 
                                    ${theme === "Dark" ? "text-gray-200" : "text-gray-800"}`}>
                                        No Categories Added
                                    </h1>

                                    {/* Decorative underline that expands */}
                                    <div className="h-1 w-0 bg-blue-500 rounded-full mt-2 animate-[widthExpand_1s_ease-in-out_forwards]"></div>

                                    <p className={`text-xs mt-3 opacity-60 uppercase tracking-[0.2em] font-semibold
                                    ${theme === "Dark" ? "text-gray-400" : "text-gray-500"}`}>
                                        Your inventory is waiting
                                    </p>
                                </div>

                                {/* Custom Animation Keyframes (Add this to your globals.css or tailwind.config.js) */}
                                <style jsx>{`
                                @keyframes widthExpand {
                                    from { width: 0; }
                                    to { width: 40px; }
                                }
                                @keyframes slideUp {
                                    from { opacity: 0; transform: translateY(20px); }
                                    to { opacity: 1; transform: translateY(0); }
                                }
                            `}</style>
                            </div>
                        )}
                    </div>
                </aside>

                {/* Items Management */}
                <section className="w-full lg:w-3/4 sm:h-auto h-screen flex flex-col rounded-xl">

                    {/* Top Bar: Title + Category Buttons */}
                    {/* 1️⃣ Title */}
                    <h3 className="text-sm sm:text-lg font-bold sm:m-5 m-4">
                        Items Management
                    </h3>
                    {/* 2️⃣ Search + Action Buttons */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:mb-4 w-full">
                        {/* Buttons */}
                        <div className="flex w-full justify-evenly sm:justify-start">
                            <button
                                className={`text-xs sm:text-sm px-4 sm:py-2 py-1 sm:mx-10 rounded-lg ${theme === "Dark"
                                    ? "text-white bg-green-800 hover:bg-green-600"
                                    : "bg-green-600 text-white hover:bg-green-800"
                                    }`}
                                onClick={itemModalFunBtn}
                            >
                                + Add Item
                            </button>

                            {/* Download Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setOpen((prev) => !prev)}
                                    className={`text-xs sm:text-sm px-4 sm:py-2 py-1 rounded-lg ${theme === "Dark"
                                        ? "text-white bg-blue-800 hover:bg-blue-600"
                                        : "bg-blue-600 text-white hover:bg-blue-800"
                                        }`}
                                >
                                    Download ▾
                                </button>

                                {open && (
                                    <div
                                        className={`absolute mt-1 w-32 rounded-lg shadow   ${theme === "Dark"
                                            ? "bg-slate-800 text-white"
                                            : "bg-white text-black"
                                            }`}
                                    >
                                        <button
                                            onClick={() => {
                                                handleDownloadExcel();
                                                setOpen(false);
                                            }}
                                            className="block w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-blue-500 hover:text-white"
                                        >
                                            Excel (.xlsx)
                                        </button>

                                        <button
                                            onClick={() => {
                                                handleDownloadPDF();
                                                setOpen(false);
                                            }}
                                            className="block w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-blue-500 hover:text-white"
                                        >
                                            PDF (.pdf)
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Search Bar */}
                        <div className="flex flex-col w-full gap-2 px-2">

                            {/* Mobile: Search + Sort Row */}
                            <div className="flex flex-row w-full justify-evenly items-center gap-2">


                                {/* Sort Buttons */}
                                <div className="flex flex-wrap gap-2 sm:hidden ">
                                    {["Name", "Stock", "Price"].map((key) => (
                                        <button
                                            key={key}
                                            className={`px-2 py-1 text-xs rounded-lg
                  ${theme === "Dark"
                                                    ? "text-white border border-blue-800 hover:bg-blue-600"
                                                    : "bg-blue-600 text-white hover:bg-blue-400"
                                                }`}
                                            onClick={() => handleSort(key)}
                                        >
                                            {key}{" "}
                                            {sortConfig.key === key
                                                ? sortConfig.direction === "asc" ? "▲" : "▼"
                                                : ""}
                                        </button>
                                    ))}
                                </div>

                                {/* Search Input */}
                                <div className="flex flex-1 items-center gap-2">
                                    <input
                                        type="text"
                                        placeholder="Search items..."
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className={`flex-1 md:flex-[0.7] p-2 rounded-xl mx-3 sm:mx-0 text-xs sm:text-sm 
              ${theme === "Dark"
                                                ? "bg-gray-300 text-black hover:bg-gray-100"
                                                : "bg-white shadow-lg hover:bg-gray-100"
                                            }`}
                                    />

                                    <FaSearch className="text-lg cursor-pointer opacity-70 hover:opacity-100 sm:block hidden" />
                                </div>

                            </div>


                            {/* Desktop & Tablet (sm+) layout stays the same */}
                        </div>


                    </div>

                    {/* 3️⃣ Categories Buttons */}
                    <div className="flex flex-wrap justify-center items-center gap-2 m-auto sm:m-2">
                        {categories && categories.map((category) => (
                            <button
                                key={category.id}
                                className={`font-bold py-1 px-3 rounded-xl text-xs my-1 sm:text-md ${activeCategory === category.Name
                                    ? 'bg-blue-600 text-white shadow-md'
                                    : `${theme === "Dark" ? "bg-gray-700 text-white" : "bg-gray-200 text-gray-800 hover:bg-gray-300"}`
                                    }`}
                                onClick={() => setActiveCategory(category.Name)}
                            >
                                {category.Name}
                            </button>
                        ))}
                    </div>

                    {/* Scrollable Items Table */}
                    <div className="flex-1 overflow-x-auto sm:overflow-x-visible overflow-y-auto">
                        {/* Desktop Table (unchanged) */}
                        <table className="min-w-full table-auto shadow-lg rounded hidden sm:table">
                            <thead className={`${theme === "Dark" ? "bg-blue-800" : "bg-blue-600 text-white"}`}>
                                <tr>
                                    {[{ label: "#", key: null, sortable: false },
                                    { label: "Name", key: "Name", sortable: true },
                                    { label: "Category", key: "Category", sortable: true },
                                    { label: "Stock", key: "Stock", sortable: true },
                                    { label: "Buying Price", key: "Buying Price", sortable: true },
                                    { label: "SellingPrice", key: "Selling Price", sortable: true },
                                    { label: "Actions", key: null, sortable: false }
                                    ].map((col, idx) => (
                                        <th
                                            key={idx}
                                            onClick={col.sortable ? () => handleSort(col.key) : undefined}
                                            className={`border px-4 py-1 text-md ${col.sortable ? "cursor-pointer select-none" : ""} ${theme === "Dark" ? "border-blue-800" : "border-gray-300"}`}
                                        >
                                            {col.label}
                                            {col.sortable && sortConfig.key === col.key && (
                                                <span className="ml-1">{sortConfig.direction === "asc" ? "↑" : "↓"}</span>
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {sortedItems &&
                                    sortedItems
                                        .filter((item) =>
                                            item.Name.toLowerCase().includes(searchQuery.toLowerCase())
                                        )
                                        .map((item, index) => (
                                            <tr key={item.id} className={`text-sm ${theme === "Dark" ? "hover:bg-blue-100 hover:text-black" : "bg-white border border-gray-300 hover:bg-blue-100"}`}>
                                                <td className={`px-4 text-center py-2 ${theme === "Dark" ? "border-blue-800" : "border-gray-300 border"}`}>{index + 1}</td>
                                                <td className={`px-4 text-center py-2 ${theme === "Dark" ? "border-blue-800" : "border-gray-300 border"}`}>{item.Name}</td>
                                                <td className={`px-4 text-center py-2 ${theme === "Dark" ? "border-blue-800" : "border-gray-300 border"}`}>{item.Category}</td>
                                                <td className={`px-4 text-center py-2 ${theme === "Dark" ? "border-blue-800" : "border-gray-300 border"}`}>{item.Stock}</td>
                                                <td className={`px-4 text-center py-2 ${theme === "Dark" ? "border-blue-800" : "border-gray-300 border"}`}>{item.BuyingPrice}</td>
                                                <td className={`px-4 text-center py-2 ${theme === "Dark" ? "border-blue-800" : "border-gray-300 border"}`}>{item.Price}</td>
                                                <td className={`px-4 py-2 text-center ${theme === "Dark" ? "border-blue-800" : "border-gray-300 border"}`}>
                                                    <button
                                                        className={`py-1 px-3 mx-2 rounded ${theme === "Dark" ? "text-white bg-yellow-800 hover:bg-yellow-600" : "bg-yellow-500 text-white hover:bg-yellow-700"}`}
                                                        onClick={() =>
                                                            itemStocksetID(
                                                                item.id,
                                                                item.Name,
                                                                item.Stock,
                                                                item.BuyingPrice,
                                                                item.Price,
                                                                item.Category,
                                                                item.Unit,
                                                                item.Code
                                                            )
                                                        }
                                                    >
                                                        Adjust Stock
                                                    </button>

                                                    <button
                                                        className={`py-1 px-3 mx-2 rounded ${theme === "Dark" ? "text-white bg-blue-800 hover:bg-blue-600" : "bg-blue-600 text-white hover:bg-blue-800"}`}
                                                        onClick={() => itemEditsetID(item.id, item.Name, item.BuyingPrice, item.Stock, item.Price, item.Category, item.Unit, item.Code)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className={`py-1 px-3 rounded sm:my-0 my-3 ${theme === "Dark" ? "text-white bg-red-800 hover:bg-red-600" : "bg-red-600 text-white hover:bg-red-800"}`}
                                                        onClick={() => itemDeletesetID(item.id, item.Name)}
                                                    >
                                                        Delete
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                            </tbody>
                        </table>

                        {/* Mobile Card Layout (new design) */}
                        <div className="sm:hidden flex flex-col gap-1">
                            {sortedItems &&
                                sortedItems
                                    .filter((item) =>
                                        item.Name.toLowerCase().includes(searchQuery.toLowerCase())
                                    )
                                    .map((item, index) => (
                                        <div
                                            key={item.id}
                                            className={`mx-2 rounded-xl p-4 border shadow-sm
          ${theme === "Dark" ? "bg-blue-900 border-blue-700 text-white" : "bg-white border-gray-300 text-black"}`}
                                        >
                                            {/* Header */}
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="font-semibold text-sm truncate">{item.Name}</span>
                                                <span className="text-xs font-semibold opacity-70">#{index + 1}</span>
                                            </div>

                                            {/* Meta */}
                                            <div className="grid grid-cols-3 gap-3 text-xs mb-3">
                                                {/* Category */}
                                                <div className="flex flex-col">
                                                    <span className="opacity-60 text-xs">Category</span>
                                                    <span className="text-sm font-semibold truncate">{item.Category}</span>
                                                </div>

                                                {/* Stock */}
                                                <div className="flex flex-col">
                                                    <span className="opacity-60 text-xs">Stock</span>
                                                    <span className="text-sm font-semibold">{item.Stock}</span>
                                                </div>

                                                {/* Price */}
                                                <div className="flex flex-col">
                                                    <span className="opacity-60 text-xs">Price</span>
                                                    <span className="text-sm font-bold">{item.Price}</span>
                                                </div>
                                            </div>

                                            {/* Actions - separate row, flex wrap */}
                                            <div className="flex justify-evenly ">
                                                <button
                                                    className={`px-2.5 py-1 text-xs sm:text-sm rounded-md shadow-sm ${theme === "Dark" ? "bg-blue-500 hover:bg-blue-600 text-white" : "bg-yellow-500 hover:bg-yellow-700 text-white"}`}
                                                    onClick={() =>
                                                        itemStocksetID(item.id, item.Name, item.Stock, item.Price, item.Category, item.Unit, item.Code)
                                                    }
                                                >
                                                    Adjust Stock
                                                </button>
                                                <button
                                                    className={`px-2.5 py-1 text-xs sm:text-sm rounded-md shadow-sm ${theme === "Dark" ? "bg-blue-800 hover:bg-blue-600 text-white" : "bg-blue-600 hover:bg-blue-800 text-white"}`}
                                                    onClick={() =>
                                                        itemEditsetID(item.id, item.Name, item.Stock, item.Price, item.Category, item.Unit, item.Code)
                                                    }
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className={`px-2.5 py-1 text-xs sm:text-sm rounded-md shadow-sm ${theme === "Dark" ? "bg-red-800 hover:bg-red-600 text-white" : "bg-red-600 hover:bg-red-800 text-white"}`}
                                                    onClick={() => itemDeletesetID(item.id, item.Name)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                        </div>



                        {(!filteredItems || filteredItems.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-20 w-full overflow-hidden">

                                {/* Rhythm & Animation Container */}
                                <div className="relative mb-10">
                                    {/* Background "Heat/Steam" Pulse */}
                                    <div className={`absolute inset-0 scale-150 blur-[60px] opacity-20 animate-[pulse_4s_ease-in-out_infinite] 
        ${theme === "Dark" ? "bg-blue-400" : "bg-blue-600"}`}></div>

                                    {/* Main Icon - Floating Rhythm */}
                                    <div className="relative   animate-[float_3.5s_ease-in-out_infinite]">
                                        <FaBoxOpen className={`text-7xl transition-all duration-500 hover:scale-110 
          ${theme === "Dark" ? "text-white" : "text-blue-700"}`} />

                                        {/* The "Fresh" Sparkle */}
                                        <div className="absolute -top-2 -right-2 animate-pulse">
                                            <div className={`w-3 h-3 rotate-45 ${theme === "Dark" ? "bg-blue-300" : "bg-blue-500"}`}></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Kitchen-Focused Wording */}
                                <div className="text-center px-4">
                                    <h1 className={`text-2xl sm:text-3xl font-black tracking-tight opacity-0 animate-[fadeInSlide_0.8s_ease-out_forwards]
        ${theme === "Dark" ? "text-white" : "text-gray-900"}`}>
                                        Your Store is Empty
                                    </h1>

                                    {/* The Growth Line */}
                                    <div className={`h-[3px] w-0 mx-auto my-4 bg-blue-500 animate-[growLine_1s_ease-in-out_0.5s_forwards]`}></div>

                                    <p className={`text-md font-medium max-w-xs mx-auto opacity-0 animate-[fadeInSlide_0.8s_ease-out_0.8s_forwards]
        ${theme === "Dark" ? "text-gray-400" : "text-gray-500"}`}>
                                        Let’s add your first item at the Store
                                    </p>
                                </div>

                                {/* Consistent Keyframes */}
                                <style jsx>{`
      @keyframes float {
        0%, 100% { transform: translateY(0px); }
        50% { transform: translateY(-20px); }
      }
      @keyframes fadeInSlide {
        from { opacity: 0; transform: translateY(15px); filter: blur(10px); }
        to { opacity: 1; transform: translateY(0); filter: blur(0); }
      }
      @keyframes growLine {
        from { width: 0; }
        to { width: 80px; }
      }
    `}</style>
                            </div>
                        )}
                    </div>


                </section>
            </div>


            {/* Items add modal */}

            {itemModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
                    <div
                        className={`p-6 rounded-xl shadow-lg w-96 mx-4
                ${theme === "Dark" ? "bg-[#171941]" : "bg-white"}
            `}
                    >
                        <h2 className="text-md sm:-lg font-bold mb-5 text-center">
                            Add Item
                        </h2>

                        <div className="space-y-2">

                            {/* ITEM NAME */}
                            <div className="">
                                <label className="text-xs sm:text-sm font-medium text-gray-600">
                                    Item Name
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Enter item name"
                                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#303133] pl-12 shadow-md text-sm sm:text-base"
                                        style={{ color: "#000000" }}
                                        value={itemName}
                                        onChange={(e) => setItemName(e.target.value)}
                                    />
                                    <FaTags className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-lg" />
                                </div>
                            </div>

                            {/* CATEGORY */}
                            <div className="">
                                <label className="text-xs sm:text-sm font-medium text-gray-600">
                                    Category
                                </label>

                                <select
                                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#303133] shadow-md text-black text-sm sm:text-base"
                                    value={ItemCategory}
                                    onChange={(e) => setItemCategory(e.target.value)}
                                >
                                    <option value="" disabled>
                                        -- Select Category --
                                    </option>
                                    <option value="None">
                                        None
                                    </option>

                                    {categories?.map((category) => (
                                        <option key={category.id} value={category.Name}>
                                            {category.Name}
                                        </option>
                                    ))}
                                </select>
                            </div>


                            {/* PRICE */}
                            <div className="">
                                <label className="text-xs sm:text-sm font-medium text-gray-600">
                                    Buying Price
                                </label>

                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="Enter Buying price"
                                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#303133] pl-12 shadow-md text-sm sm:text-base"
                                        style={{ color: "#000000" }}
                                        value={itemBuyingPrice}
                                        onChange={(e) => setItemBuyingPrice(e.target.value)}
                                    />
                                    <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-lg" />
                                </div>
                            </div>


                            {/* PRICE */}
                            <div className="">
                                <label className="text-xs sm:text-sm font-medium text-gray-600">
                                    Selling Price
                                </label>

                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="Enter selling price"
                                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#303133] pl-12 shadow-md text-sm sm:text-base"
                                        style={{ color: "#000000" }}
                                        value={itemPrice}
                                        onChange={(e) => setItemPrice(e.target.value)}
                                    />
                                    <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-lg" />
                                </div>
                            </div>

                            {/* STOCK */}
                            <div className="">
                                <label className="text-xs sm:text-sm font-semibold text-gray-700">
                                    Stock Information
                                </label>

                                <div className="grid grid-cols-4 gap-3">

                                    {/* STOCK TYPE */}
                                    <div className="col-span-1 space-y-1">
                                        <label className="text-xs font-medium text-gray-500">
                                            Type
                                        </label>

                                        <div className="relative">
                                            {/* Dynamic Icon */}
                                            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-sm">
                                                {stockType === "na" ? <FaBan /> : <FaHashtag />}
                                            </div>

                                            <select
                                                className="w-full p-3 border border-gray-300 rounded text-xs sm:text-base
                       focus:outline-none focus:ring-2 focus:ring-[#303133]
                       pl-9 shadow-md"
                                                value={stockType}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setStockType(value);
                                                    setItemStock(value === "na" ? "N/A" : "");
                                                }}
                                            >
                                                <option value="number">Number</option>
                                                <option value="na">N/A</option>
                                            </select>
                                        </div>
                                    </div>


                                    {/* STOCK VALUE */}
                                    <div className="col-span-3">
                                        <label className="text-xs font-medium text-gray-500">
                                            Stock
                                        </label>

                                        <div className="relative">
                                            <input
                                                type="number"
                                                disabled={stockType === "na"}
                                                placeholder={stockType === "na" ? "N/A" : "Enter stock"}
                                                className={`w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#303133] pl-10 shadow-md text-sm sm:text-base
                                        ${stockType === "na"
                                                        ? "bg-gray-100 cursor-not-allowed"
                                                        : ""
                                                    }
                                    `}
                                                style={{ color: "#000000" }}
                                                value={stockType === "na" ? "" : itemStock}
                                                onChange={(e) => setItemStock(e.target.value)}
                                            />

                                            <FaBoxOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-base" />
                                        </div>
                                    </div>

                                </div>


                            </div>

                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex justify-evenly mt-6">
                            <button
                                className={`px-5 py-2 rounded text-white font-medium text-xs sm:text-sm
                        ${theme === "Dark"
                                        ? "bg-green-800 hover:bg-green-600"
                                        : "bg-green-600 hover:bg-green-800"
                                    }
                    `}
                                onClick={addItem}
                            >
                                Add
                            </button>

                            <button
                                className={`px-5 py-2 rounded text-white font-medium text-xs sm:text-sm
                        ${theme === "Dark"
                                        ? "bg-red-800 hover:bg-red-600"
                                        : "bg-red-600 hover:bg-red-800"
                                    }
                    `}
                                onClick={itemModalFun}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}


            {/* Items stock*/}
            {itemModalStock && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className={` p-6 rounded-xl shadow w-96 mx-4
                        ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white "
                        }`
                    }>
                        <h2 className="text-md sm:text-lg font-bold mb-4 text-center">Adjust Item Stock </h2>


                        <div className="">
                            <label className="text-sm sm:text-sm font-semibold text-gray-700">
                                Stock Information
                            </label>

                            <div className="grid grid-cols-4 gap-3">

                                {/* STOCK TYPE */}
                                <div className="col-span-1 space-y-1">
                                    <label className="text-xs font-medium text-gray-500">
                                        Type
                                    </label>

                                    <div className="relative">
                                        {/* Dynamic Icon */}
                                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-sm">
                                            {stockType === "na" ? <FaBan /> : <FaHashtag />}
                                        </div>

                                        <select
                                            className="w-full p-3 border border-gray-300 rounded text-sm sm:text-base
                       focus:outline-none focus:ring-2 focus:ring-[#303133]
                       pl-9 shadow-md"
                                            value={stockType}
                                            onChange={(e) => {
                                                const value = e.target.value;
                                                setStockType(value);
                                                setItemStock(value === "na" ? "N/A" : "");
                                            }}
                                        >
                                            <option value="number">Number</option>
                                            <option value="na">N/A</option>
                                        </select>
                                    </div>
                                </div>


                                {/* STOCK VALUE */}
                                <div className="col-span-3">
                                    <label className="text-xs font-medium text-gray-500">
                                        Stock
                                    </label>

                                    <div className="relative">
                                        <input
                                            type="number"
                                            disabled={stockType === "na"}
                                            placeholder={stockType === "na" ? "N/A" : "Enter stock"}
                                            className={`w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#303133] pl-10 shadow-md text-sm sm:text-base
                                        ${stockType === "na"
                                                    ? "bg-gray-100 cursor-not-allowed"
                                                    : ""
                                                }
                                    `}
                                            style={{ color: "#000000" }}
                                            value={stockType === "na" ? "" : itemStock}
                                            onChange={(e) => setItemStock(e.target.value)}
                                        />

                                        <FaBoxOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-base" />
                                    </div>
                                </div>

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
                                Edit Stock
                            </button>
                            <button
                                className={` text-white px-4 py-2 rounded mt-4 text-xs sm:text-base
                                  ${theme === "Dark"
                                        ? "bg-red-800  hover:bg-red-600"
                                        : "bg-red-600  hover:bg-red-800 "
                                    }`}
                                onClick={itemModalFunStock}
                            >
                                Cancel
                            </button>
                        </div>

                    </div>
                </div>
            )}


            {/* Items edit  */}
            {itemModalEdit && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
                    <div
                        className={`p-6 rounded-xl shadow-lg w-96 mx-4
                ${theme === "Dark" ? "bg-[#171941]" : "bg-white"}
            `}
                    >
                        <h2 className="text-sm sm:text-lg font-bold mb-5 text-center">
                            Edit Item
                        </h2>

                        <div className="space-y-2">

                            {/* ITEM NAME */}
                            <div>
                                <label className="text-xs sm:text-sm font-medium text-gray-600">
                                    Item Name
                                </label>

                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Enter item name"
                                        className="w-full p-3 border border-gray-300 rounded text-sm sm:text-base
                            focus:outline-none focus:ring-2 focus:ring-[#303133]
                            pl-12 shadow-md"
                                        style={{ color: "#000000" }}
                                        value={itemName}
                                        onChange={(e) => setItemName(e.target.value)}
                                    />
                                    <FaTags className="absolute left-3 top-1/2 -translate-y-1/2 text-black text-lg" />
                                </div>
                            </div>

                            {/* CATEGORY */}
                            <div>
                                <label className="text-xs sm:text-sm font-medium text-gray-600">
                                    Category
                                </label>

                                <select
                                    className="w-full p-3 border border-gray-300 rounded text-sm sm:text-base
                        focus:outline-none focus:ring-2 focus:ring-[#303133]
                        shadow-md text-black"
                                    value={ItemCategory}
                                    onChange={(e) => setItemCategory(e.target.value)}
                                >
                                    <option value="" disabled>
                                        -- Select Category --
                                    </option>
                                    <option value="None">
                                        None
                                    </option>

                                    {categories?.map((category) => (
                                        <option key={category.id} value={category.Name}>
                                            {category.Name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* PRICE */}
                            <div className="">
                                <label className="text-xs sm:text-sm font-medium text-gray-600">
                                    Buying Price
                                </label>

                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="Enter Buying price"
                                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#303133] pl-12 shadow-md text-sm sm:text-base"
                                        style={{ color: "#000000" }}
                                        value={itemBuyingPrice}
                                        onChange={(e) => setItemBuyingPrice(e.target.value)}
                                    />
                                    <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-lg" />
                                </div>
                            </div>


                            {/* PRICE */}
                            <div className="">
                                <label className="text-xs sm:text-sm font-medium text-gray-600">
                                    Selling Price
                                </label>

                                <div className="relative">
                                    <input
                                        type="number"
                                        placeholder="Enter selling price"
                                        className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#303133] pl-12 shadow-md text-sm sm:text-base"
                                        style={{ color: "#000000" }}
                                        value={itemPrice}
                                        onChange={(e) => setItemPrice(e.target.value)}
                                    />
                                    <FaDollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-black text-lg" />
                                </div>
                            </div>



                            {/* STOCK */}
                            <div>
                                <label className="text-xs sm:text-sm font-semibold text-gray-700">
                                    Stock Information
                                </label>

                                <div className="grid grid-cols-4 gap-3">

                                    {/* STOCK TYPE */}
                                    <div className="col-span-1 ">
                                        <label className="text-xs font-medium text-gray-500">
                                            Type
                                        </label>

                                        <div className="relative">
                                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-black text-base">
                                                {stockType === "na" ? <FaBan /> : <FaHashtag />}
                                            </div>

                                            <select
                                                className="w-full p-3 border border-gray-300 rounded text-sm sm:text-base
                                    focus:outline-none focus:ring-2 focus:ring-[#303133]
                                    pl-9 shadow-md"
                                                value={stockType}
                                                onChange={(e) => {
                                                    const value = e.target.value;
                                                    setStockType(value);
                                                    setItemStock(value === "na" ? "N/A" : "");
                                                }}
                                            >
                                                <option value="number">Number</option>
                                                <option value="na">N/A</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* STOCK VALUE */}
                                    <div className="col-span-3">
                                        <label className="text-xs font-medium text-gray-500">
                                            Stock
                                        </label>

                                        <div className="relative">
                                            <input
                                                type="number"
                                                disabled={stockType === "na"}
                                                placeholder={stockType === "na" ? "N/A" : "Enter stock"}
                                                className={`w-full p-3 border border-gray-300 rounded text-sm sm:text-base
                                    focus:outline-none focus:ring-2 focus:ring-[#303133]
                                    pl-10 shadow-md
                                    ${stockType === "na"
                                                        ? "bg-gray-100 cursor-not-allowed"
                                                        : ""
                                                    }`}
                                                style={{ color: "#000000" }}
                                                value={stockType === "na" ? "" : itemStock}
                                                onChange={(e) => setItemStock(e.target.value)}
                                            />

                                            <FaBoxOpen className="absolute left-3 top-1/2 -translate-y-1/2 text-black text-base" />
                                        </div>
                                    </div>

                                </div>
                            </div>

                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex justify-evenly mt-6">
                            <button
                                className={`px-5 py-2 rounded text-white font-medium text-xs sm:text-base
                        ${theme === "Dark"
                                        ? "bg-green-800 hover:bg-green-600"
                                        : "bg-green-600 hover:bg-green-800"
                                    }`}
                                onClick={editItem}
                            >
                                Save
                            </button>

                            <button
                                className={`px-5 py-2 rounded text-white font-medium text-xs sm:text-base
                        ${theme === "Dark"
                                        ? "bg-red-800 hover:bg-red-600"
                                        : "bg-red-600 hover:bg-red-800"
                                    }`}
                                onClick={itemModalFunEdit}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Items delete*/}
            {itemModalDelete && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className={` p-6 rounded-xl shadow w-96  mx-4
                        ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white "
                        }`
                    }>
                        <h2 className="text-sm sm:text-lg font-bold mb-4 text-center">Delete Item</h2>

                        <div className="mt-4 font-semibold text-sm sm:text-md">
                            Are you sure you want to delete this item?
                        </div>

                        <div className=" flex flex-row justify-evenly">
                            <button
                                className={` text-white px-4 py-2 rounded  mt-4  text-sm sm:text-base
                                
                              ${theme === "Dark"
                                        ? "bg-green-800  hover:bg-green-600"
                                        : "bg-green-600  hover:bg-green-800 "
                                    }`}
                                onClick={deleteItem}
                            >
                                Ok
                            </button>
                            <button
                                className={` text-white px-4 py-2 rounded mt-4 text-sm sm:text-base
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

            {/*Categories modal */}
            {catModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
                    <div
                        className={`p-6 rounded-xl shadow-lg w-96 mx-4
                ${theme === "Dark" ? "bg-[#171941]" : "bg-white"}
            `}
                    >
                        <h2 className="text-md sm:text-lg font-bold mb-5 text-center">
                            Add Category
                        </h2>

                        <div className="space-y-2">

                            {/* CATEGORY NAME */}
                            <div>
                                <label className="text-xs sm:text-sm font-medium text-gray-600">
                                    Category Name
                                </label>

                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Enter category name"
                                        className="w-full p-3 border border-gray-300 rounded text-sm sm:text-base
                            focus:outline-none focus:ring-2 focus:ring-[#303133]
                            pl-12 shadow-md"
                                        style={{ color: "#000000" }}
                                        value={catName}
                                        onChange={(e) => setCatName(e.target.value)}
                                    />
                                    <FaTags className="absolute left-3 top-1/2 -translate-y-1/2 text-black text-lg" />
                                </div>
                            </div>

                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex justify-evenly mt-6">
                            <button
                                className={`px-5 py-2 rounded text-white font-medium text-xs sm:text-base
                        ${theme === "Dark"
                                        ? "bg-green-800 hover:bg-green-600"
                                        : "bg-green-600 hover:bg-green-800"
                                    }`}
                                onClick={addCategory}
                            >
                                Add
                            </button>

                            <button
                                className={`px-5 py-2 rounded text-white font-medium  text-xs sm:text-base
                        ${theme === "Dark"
                                        ? "bg-red-800 hover:bg-red-600"
                                        : "bg-red-600 hover:bg-red-800"
                                    }`}
                                onClick={catModalFun}
                            >
                                Close
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/*Categories edit */}
            {catModalEdit && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
                    <div
                        className={`p-6 rounded-xl shadow-lg w-96 m-4
                ${theme === "Dark" ? "bg-[#171941]" : "bg-white"}
            `}
                    >
                        <h2 className="text-sm sm:text-lg font-bold mb-5 text-center">
                            Edit Category
                        </h2>

                        <div className="space-y-2">

                            {/* CATEGORY NAME */}
                            <div>
                                <label className="text-xs sm:text-sm font-medium text-gray-600">
                                    Category Name
                                </label>

                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Enter category name"
                                        className="w-full p-3 border border-gray-300 rounded text-xs sm:text-base
                            focus:outline-none focus:ring-2 focus:ring-[#303133]
                            pl-12 shadow-md"
                                        style={{ color: "#000000" }}
                                        value={catName}
                                        onChange={(e) => setCatName(e.target.value)}
                                    />
                                    <FaTags className="absolute left-3 top-1/2 -translate-y-1/2 text-black text-lg" />
                                </div>
                            </div>

                        </div>

                        {/* ACTION BUTTONS */}
                        <div className="flex justify-evenly mt-6">
                            <button
                                className={`px-5 py-2 rounded text-white font-medium text-xs sm:text-base
                        ${theme === "Dark"
                                        ? "bg-green-800 hover:bg-green-600"
                                        : "bg-green-600 hover:bg-green-800"
                                    }`}
                                onClick={editCategories}
                            >
                                Save
                            </button>

                            <button
                                className={`px-5 py-2 rounded text-white font-medium text-xs sm:text-base
                        ${theme === "Dark"
                                        ? "bg-red-800 hover:bg-red-600"
                                        : "bg-red-600 hover:bg-red-800"
                                    }`}
                                onClick={catModalFunEdit}
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/*Categories delete */}
            {catModalDelete && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className={` p-6 rounded-xl shadow w-96  mx-4
                        ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white "
                        }`
                    }>
                        <h2 className="text-sm sm:text-lg font-bold mb-4 text-center">Delete Category </h2>

                        <div className="mt-4 font-semibold text-sm sm:text-md">
                            Are you sure you want to delete this category?
                        </div>
                        <div className=" flex flex-row justify-evenly">
                            <button
                                className={` text-white px-4 py-2 rounded  mt-4  text-xs sm:text-base
                                
                              ${theme === "Dark"
                                        ? "bg-green-800  hover:bg-green-600"
                                        : "bg-green-600  hover:bg-green-800 "
                                    }`}
                                onClick={deleteCategory}
                            >
                                OK
                            </button>
                            <button
                                className={` text-white px-4 py-2 rounded mt-4 text-xs sm:text-base
                                  ${theme === "Dark"
                                        ? "bg-red-800  hover:bg-red-600"
                                        : "bg-red-600  hover:bg-red-800 "
                                    }`}
                                onClick={catModalFunDelete}
                            >
                                Close
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* Auto-Close Modals */}
            {addCatModalsuccess && (
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
                        <p>The Category was Added</p>
                    </div>
                </div>
            )}

            {addCatModalFail && (
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
                        <p>The Category was not Added</p>
                    </div>
                </div>
            )}


            {addCatModalFailBlank && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className={` p-6 rounded-xl 
                    
                     ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white shadow-lg "
                        }`}
                    >
                        <div className='flex justify-center'>
                            <TbXboxX className='text-red-600 text-3xl   ' />
                            <h2 className="text-lg font-bold mb-4 mx-1">Failed</h2>
                        </div>
                        <p>Fill all Fields</p>
                    </div>
                </div>
            )}


            {editCatModalsuccess && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                    <div className={` p-6 rounded-xl 
                    
                     ${theme === "Dark"
                            ? " bg-[#171941] "
                            : " bg-white shadow-lg "
                        }`}>
                        <div className='flex justify-center'>
                            <FaDollarSign className='text-green-600 text-4xl ' />
                            <div className='flex justify-center'>

                                <TiTick className='text-green-600 text-4xl  ' />
                                <h2 className="text-lg font-bold mb-4">Success</h2>
                            </div>
                        </div>
                        <p>The Category was Edited</p>
                    </div>
                </div>
            )}

            {editCatModalFail && (
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
                        <p>The Category was not Edited</p>
                    </div>
                </div>
            )}

            {deleteCatModalsuccess && (
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
                        <p>The Category was Deleted</p>
                    </div>
                </div>
            )}

            {deleteCatModalFail && (
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
                        <p>The Category was not Deleted</p>
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
                    <div className={`
            p-6 rounded-xl w-[90%] max-w-md transition-all
            ${theme === "Dark"
                            ? "bg-[#171941] text-white"
                            : "bg-white text-black shadow-2xl"
                        }
        `}>

                        {/* Header */}
                        <div className="flex justify-center items-center gap-2 mb-3">
                            <TiTick className="text-green-500 text-4xl" />
                            <h2 className="text-xl font-bold">Updated Successfully</h2>
                        </div>

                        <p className="font-semibold text-center mb-3">
                            Changes made:
                        </p>

                        {/* Details list */}
                        <ul className="mt-2 space-y-2">
                            {changeDetails.map((c, i) => (
                                <li
                                    key={i}
                                    className={`
                            p-3 rounded-lg flex gap-2 items-start border
                            ${theme === "Dark"
                                            ? "bg-[#1f2250] border-[#2a2d6a]"
                                            : "bg-gray-100 border-gray-300"
                                        }
                        `}
                                >
                                    <span className="text-green-400 font-bold mt-1">•</span>
                                    <span className="text-sm leading-5">{c}</span>
                                </li>
                            ))}
                        </ul>
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

export default Inventory
