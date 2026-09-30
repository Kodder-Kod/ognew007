"use client"


import itemsdata from "@/app/data/items";
import categoriesdata from "@/app/data/categories";
import { useState } from "react";


const Test = () => {


    /// Modals
    const [itemModal, setItemModal] = useState(false)
    const [catModal, setCatModal] = useState(false);

    const itemModalFun = () => setItemModal(false)
    const catModalFun = () => setCatModal(false);



    //auto close modal 
    const handleOpenAutoCloseModal = () => {
        setShowAutoCloseModal(true);
        setTimeout(() => setShowAutoCloseModal(false), 3000);  
    };



    ///// Category operations
    const [categories, setCategories] = useState(categoriesdata);
    const [items, setItems] = useState(itemsdata);
    const [searchQuery, setSearchQuery] = useState("");


    const addCategory = () => {

    };

    const deleteCategory = (category) => {

    };



    const editCategories = (id) => {

    };

    ////// Handlers for item operations
    const addItem = () => {

    };

    const deleteItem = (id) => {

    };

    const editItem = (id) => {

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


    return (
        <div className="min-h-screen flex flex-col bg-gray-100">
            {/* Header */}

            <header className="bg-gray-200 py-4 px-6 text-center border-b">
                <h1 className="text-2xl font-bold">Chisend POS</h1>
                <h1 className="text-2xl font-bold">Inventory Management</h1>
            </header>

            {/* Main Layout */}
            <div className="flex flex-grow ">
                {/* Categories Management */}
                <aside className="w-1/3 bg-gradient-to-b from-blue-50 to-blue-100 p-6 border-r shadow-md h-screen flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-blue-800">Manage Categories</h3>
                        <button
                            className="bg-green-400 text-white text-sm px-3 py-1 rounded shadow hover:bg-green-500 focus:outline-none focus:ring"
                           onClick={setCatModal(true)}
                        >
                            + Add Category
                        </button>
                    </div>

                    {/* Scrollable Categories Section */}
                    <div className=" grid grid-cols-1 gap-4 px-10 pt-2 overflow-y-auto ">
                        {categories.map((category, index) => (
                            <div
                                key={index}
                                className="w-100 text-center p-3 bg-white rounded shadow-md hover:bg-blue-50 transition duration-200"
                                style={{ borderRadius: 10 }}
                            >
                                <p className="text-blue-800 font-semibold text-md">{category}</p>
                                <button
                                    className="bg-yellow-500 text-white py-1 px-2 mt-2 mx-2 rounded hover:bg-yellow-600 shadow focus:outline-none focus:ring"
                                    onClick={() => editItem(category)}
                                >
                                    Edit
                                </button>
                                <button
                                    className="bg-red-100 text-red-500 hover:bg-red-200 px-2 py-1 mx-2 mt-2 rounded shadow-sm focus:outline-none focus:ring"
                                    onClick={() => deleteCategory(category)}
                                >
                                    Delete
                                </button>
                            </div>
                        ))}
                    </div>
                </aside>

                {/* Items Management */}
                <section className="w-2/3 h-screen flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-blue-700 mx-2">Items Management</h3>
                        <button
                            className="bg-blue-500 text-white text-sm px-4 py-2 rounded shadow hover:bg-blue-600 focus:outline-none focus:ring mx-3 mt-2"
                            onClick={setItemModal(true)}
                        >
                            + Add Item
                        </button>
                    </div>

                    <div className="flex justify-between items-center mb-4">
                        {/* Search Bar */}
                        <div className="flex flex-row">

                            <input
                                type="text"
                                placeholder="Search items..."
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="w-1/3 p-2  mx-2 border border-gray-300  shadow focus:outline-none focus:ring focus:border-blue-500"
                                style={{ borderRadius: 10, width: 300 }}
                            />

                            <button
                                className="bg-green-500 text-sm text-white py-2 px-4 rounded shadow hover:bg-green-600 focus:outline-none focus:ring"
                                style={{ borderRadius: 10 }}
                                onClick={handlePrint}
                            >
                                search
                            </button>

                        </div>


                        {/* Print and Download Buttons */}
                        <div className="flex space-x-4">
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
                        </div>
                    </div>

                    {/* Scrollable Items Table */}
                    <div className="flex-1 overflow-y-auto">
                        <table className="min-w-full table-auto border-collapse border border-gray-300 shadow-md">
                            <thead className="bg-blue-200 sticky top-0">
                                <tr>
                                    <th className="border border-gray-300 px-4 py-2 text-md text-blue-700 font-medium">#</th>
                                    <th className="border border-gray-300 px-4 py-2 text-md text-blue-700 font-medium">Name</th>
                                    <th className="border border-gray-300 px-4 py-2  text-md text-blue-700 font-medium">Category</th>
                                    <th className="border border-gray-300 px-4 py-2  text-md text-blue-700 font-medium">Stock</th>
                                    <th className="border border-gray-300 px-4 py-2 text-md  text-blue-700 font-medium">Price</th>
                                    <th className="border border-gray-300 px-4 py-2  text-md text-blue-700 font-medium">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items
                                    .filter((item) => item.name.toLowerCase().includes(searchQuery.toLowerCase())) // Filter items by search query
                                    .map((item, index) => (
                                        <tr key={item.id} className="hover:bg-blue-100">
                                            <td className="border border-gray-300  text-sm px-4  text-center py-2">{index + 1}</td>
                                            <td className="border border-gray-300 text-sm px-4 text-center py-2">{item.name}</td>
                                            <td className="border border-gray-300  text-sm px-4 text-center py-2">{item.category}</td>
                                            <td className="border border-gray-300 text-sm px-4 text-center py-2">{item.stock}</td>
                                            <td className="border border-gray-300 text-sm px-4 text-center py-2">{item.price}</td>
                                            <td className="border border-gray-300  text-sm px-4 py-2 text-center">
                                                <button
                                                    className="bg-yellow-500 text-white py-1 px-3 mx-2 rounded hover:bg-yellow-600 shadow focus:outline-none focus:ring"
                                                    onClick={() => editItem(item.id)}
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    className="bg-red-500 text-white py-1 px-3 rounded hover:bg-red-600 shadow focus:outline-none focus:ring"
                                                    onClick={() => deleteItem(item.id)}
                                                >
                                                    Delete
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>


            {/* Items modal */}

            {itemModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                     <div className={` p-6 rounded-xl shadow w-96 
                        ${theme === "Dark"
                                            ? " bg-[#171941] "
                                            : " bg-white "
                                        }`
                                    }>
                        <h2 className="text-lg font-bold mb-4 text-center">Give Ticket </h2>

                     


                        <div className=" flex flex-row justify-evenly">
                            <button
                                  className={` text-white px-4 py-2 rounded  mt-4 
                                
                              ${theme === "Dark"
                                        ? "bg-green-800  hover:bg-green-600"
                                        : "bg-green-600  hover:bg-green-800 "
                                    }`}
                                onClick={itemModalFun}
                            >
                                Send
                            </button>
                            <button
                                 className={` text-white px-4 py-2 rounded mt-4
                                  ${theme === "Dark"
                                        ? "bg-red-800  hover:bg-red-600"
                                        : "bg-red-600  hover:bg-red-800 "
                                    }`} 
                                onClick={itemModalFun}
                            >
                                Close
                            </button>
                        </div>

                    </div>
                </div>
            )}



            {/*Categories modal */}

            {catModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
                     <div className={` p-6 rounded-xl shadow w-96 
                        ${theme === "Dark"
                                            ? " bg-[#171941] "
                                            : " bg-white "
                                        }`
                                    }>
                        <h2 className="text-lg font-bold mb-4 text-center">Give Ticket </h2>

                      





                        <div className=" flex flex-row justify-evenly">
                            <button
                                  className={` text-white px-4 py-2 rounded  mt-4 
                                
                              ${theme === "Dark"
                                        ? "bg-green-800  hover:bg-green-600"
                                        : "bg-green-600  hover:bg-green-800 "
                                    }`}
                                onClick={catModalFun}
                            >
                                Send
                            </button>
                            <button
                                 className={` text-white px-4 py-2 rounded mt-4
                                  ${theme === "Dark"
                                        ? "bg-red-800  hover:bg-red-600"
                                        : "bg-red-600  hover:bg-red-800 "
                                    }`} 
                                onClick={catModalFun}
                            >
                                Close
                            </button>
                        </div>

                    </div>
                </div>
            )}

        </div>
    );
}

export default Test
