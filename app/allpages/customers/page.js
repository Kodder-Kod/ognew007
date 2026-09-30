"use client";

import { ref, update, push, remove, set } from 'firebase/database';
import { db } from "../../../config";
import { useUserTheme } from "@/app/componets/zustand/theme";
import { useEffect, useMemo, useState } from "react";
import { FaEnvelope, FaPhone, FaUser } from "react-icons/fa";
import {
  FiUsers,
  FiPlus,
  FiSearch,
  FiEdit2,
  FiTrash2,
  FiPhone,
  FiMail,
  FiMapPin,
  FiShoppingBag,
  FiDollarSign,
  FiCalendar,
  FiX,
  FiUser,
} from "react-icons/fi";
import { useUserID, useUserName, useUserEmail, useUserPhone } from '@/app/componets/zustand/profile';
import { useUserCustomers, useUserCustomersTotal } from '@/app/componets/zustand/customers';
import { useUserCart } from '@/app/componets/zustand/cart';
import { QRCodeSVG } from 'qrcode.react';

// ====================== HELPERS ======================

// Firebase realtime db data can come back either as an object keyed by push-id
// or (once your zustand store normalises it) as an array. This makes sure we
// always work with an array of { id, ...fields }.
const toArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Object.entries(data).map(([id, value]) => ({ id, ...value }));
};

// Same idea as toArray, but for nested "Cart" item lists that don't carry a
// push-id key we care about - we just need the plain list of items.
const toItemsArray = (data) => {
  if (!data) return [];
  if (Array.isArray(data)) return data;
  return Object.values(data);
};

const formatDate = (value) => {
  if (!value) return "-";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const formatNumber = (val) =>
  (val || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Matches a cart/sale record back to a customer, whether "Customer" was
// stored as an id, a name, or the whole customer object.
const saleBelongsToCustomer = (sale, customer) => {
  if (!sale?.Customer) return false;

  const saleCustomer = sale.Customer;

  if (typeof saleCustomer === "object") {
    return (
      saleCustomer.id === customer.id ||
      saleCustomer.Name === customer.Name
    );
  }

  return saleCustomer === customer.id || saleCustomer === customer.Name;
};

const Customers = () => {

  const Id = useUserID((state) => state.userID)
  const theme = useUserTheme((state) => state.userTheme)

  // Business details used on the printed receipt
  const bizName = useUserName((state) => state.userName)
  const bizEmail = useUserEmail((state) => state.userEmail)
  const bizPhone = useUserPhone((state) => state.userPhone)

  // ====================== LIVE DATA FROM ZUSTAND ======================

  const rawCustomers = useUserCustomers((state) => state.userCustomers)
  const customersTotal = useUserCustomersTotal((state) => state.userCustomersTotal)
  const rawCart = useUserCart((state) => state.userCart)

  const customersArray = useMemo(() => toArray(rawCustomers), [rawCustomers]);
  const cartArray = useMemo(() => toArray(rawCart), [rawCart]);

  // Build the shape the UI already expects (name, phone, joined, totalSpent,
  // purchases, history...) by deriving purchase info from the cart records.
  const customers = useMemo(() => {
    return customersArray.map((customer) => {
      const sales = cartArray
        .filter((sale) => saleBelongsToCustomer(sale, customer))
        .sort((a, b) => (b.Date || 0) - (a.Date || 0));

      const totalSpent = sales.reduce(
        (sum, sale) => sum + (Number(sale.Total) || 0),
        0
      );

      const history = sales.map((sale) => ({
        invoice: sale.CashSale || sale.id,
        date: formatDate(sale.Date),
        items: Array.isArray(sale.Cart)
          ? sale.Cart.length
          : sale.Cart
            ? Object.keys(sale.Cart).length
            : 0,
        amount: Number(sale.Total) || 0,
        status: "Paid",
        raw: sale,
      }));

      return {
        id: customer.id,
        name: customer.Name || "Unnamed Customer",
        phone: customer.Phone || "-",
        email: customer.Email || "-",
        address: customer.Address || "-",
        joined: formatDate(customer.DateCreated),
        totalSpent,
        purchases: sales.length,
        history,
      };
    });
  }, [customersArray, cartArray]);

  // ====================== SELECTION / SEARCH ======================

  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [showNewModal, setShowNewModal] = useState(false);

  useEffect(() => {
    if (customers.length === 0) {
      setSelectedId(null);
      return;
    }

    if (!selectedId || !customers.some((c) => c.id === selectedId)) {
      setSelectedId(customers[0].id);
    }
  }, [customers, selectedId]);

  const selectedCustomer = useMemo(
    () => customers.find((c) => c.id === selectedId) || null,
    [customers, selectedId]
  );

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) =>
      c.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [customers, search]);

  const totalCustomers = customers.length;

  const totalSales = customers.reduce(
    (sum, item) => sum + item.totalSpent,
    0
  );

  const totalPurchases = customers.reduce(
    (sum, item) => sum + item.purchases,
    0
  );

  // ====================== EDIT / DELETE MODAL STATE ======================

  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [editForm, setEditForm] = useState({
    id: "",
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  // ====================== RECEIPT MODAL STATE ======================

  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [receiptSale, setReceiptSale] = useState(null);

  const openReceiptModal = (sale) => {
    setReceiptSale(sale);
    setShowReceiptModal(true);
  };

  const closeReceiptModal = () => {
    setShowReceiptModal(false);
    setReceiptSale(null);
  };

  // Derive everything the receipt needs from the selected sale, the same
  // way the Debt page does it for the cart it's clearing.
  const receipt = useMemo(() => {
    const raw = receiptSale?.raw;

    const cartItems = toItemsArray(raw?.Cart);

    const total = Number(raw?.Total) || 0;

    const totalItems = cartItems.length;
    const totalQty = cartItems.reduce(
      (sum, item) => sum + (parseInt(item.stock) || 0),
      0
    );
    const totalWeight = cartItems.reduce(
      (sum, item) =>
        sum + (parseFloat(item.Weight || 0) * (parseInt(item.stock) || 0)),
      0
    );

    const vatBreakdown = {
      A: { vatable: 0, vat: 0 },
      E: { vatable: 0, vat: 0 },
      Z: { vatable: 0, vat: 0 },
    };

    cartItems.forEach((item) => {
      const code = item.vatCode || "A";
      const qty = parseInt(item.stock) || 0;
      const price = parseFloat(item.Price) || 0;
      const vatableAmount = price * qty;
      const vatAmount = code === "A" ? vatableAmount * 0.16 : 0;

      if (vatBreakdown[code]) {
        vatBreakdown[code].vatable += vatableAmount;
        vatBreakdown[code].vat += vatAmount;
      }
    });

    let dateOnly = "-";
    let timeOnly = "-";

    if (raw?.Date) {
      const jsDate = new Date(raw.Date);
      if (!isNaN(jsDate.getTime())) {
        const day = String(jsDate.getDate()).padStart(2, "0");
        const month = String(jsDate.getMonth() + 1).padStart(2, "0");
        const year = jsDate.getFullYear();
        dateOnly = `${day}/${month}/${year}`;
        timeOnly = jsDate.toTimeString().split(" ")[0];
      }
    }

    return {
      cartItems,
      total,
      totalItems,
      totalQty,
      totalWeight,
      vatBreakdown,
      dateOnly,
      timeOnly,
      cashier: raw?.EmployeeID || "-",
      receiptNumber: raw?.CashSale || receiptSale?.invoice || "-",
    };
  }, [receiptSale]);

  // ====================== FUNCTIONS ======================

  const openEditModal = () => {
    if (!selectedCustomer) return;

    setEditForm({
      id: selectedCustomer.id,
      name: selectedCustomer.name,
      phone: selectedCustomer.phone,
      email: selectedCustomer.email,
      address: selectedCustomer.address,
    });

    setShowEditModal(true);
  };

  const updateCustomer = async () => {
    if (!Id || !editForm.id) return;

    try {
      const customerRef = ref(db, `web/pos/${Id}/customers/${editForm.id}`);

      await update(customerRef, {
        Name: editForm.name,
        Phone: editForm.phone,
        Email: editForm.email,
        Address: editForm.address,
      });

      setShowEditModal(false);
    } catch (error) {
      console.error("Failed to update customer:", error);
    }
  };

  const [itemdeleteID, setItemDeleteId] = useState()

  const customerDeletesetID = (id, jina) => {

    setItemDeleteId(id)

  }


  const deleteCustomer = async () => {

    if (!Id) return;
    if (customersTotal === 1) {
      await remove(ref(db, `web/pos/${Id}/customers`));
      useUserCustomers.setState({ userCustomers: null });
      useUserCustomersTotal.setState({ userCustomersTotal: null });
    } else {
      await remove(ref(db, `web/pos/${Id}/customers/${itemdeleteID}`));
    }


    setShowDeleteModal(false);
  };

  const [form, setForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });

  const handleAddCustomer = async () => {
    if (!Id) return;

    // Validation
    if (!form.name.trim()) {
      alert("Customer name is required");
      return;
    }

    try {
      const dbRef = ref(db, `web/pos/${Id}/customers/`);

      await push(dbRef, {
        Name: form.name,
        Phone: form.phone,
        DateCreated: new Date().toISOString(),
      });

      // Clear form
      setForm({
        name: "",
        phone: "",

      });

      // Close modal
      setShowNewModal(false);

      console.log("Customer added successfully");
    } catch (error) {
      console.error("Failed to add customer:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-5 max-w-7xl mx-auto  rounded-lg">

      <div>
        {/* ========================= STATS ======================== */}
        <div className="grid grid-cols- sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-8">

          {/* Customers */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-700 via-blue-600 to-cyan-500 text-white shadow-2xl p-5 sm:p-6 group">
            <div className="absolute -right-8 -top-8 w-32 h-32 rounded-full bg-white/10 group-hover:scale-125 transition duration-700"></div>
            <div className="absolute -left-10 -bottom-10 w-40 h-40 rounded-full bg-black/10"></div>

            <div className="relative   flex justify-between items-start">
              <div>
                <p className="uppercase tracking-widest text-xs text-blue-100 font-medium">
                  Total Customers
                </p>
                <h1 className="text-2xl sm:text-3xl font-black mt-3">
                  {totalCustomers}
                </h1>
              </div>

              <div className="bg-white/20 p-3 sm:p-4 rounded-2xl backdrop-blur flex-shrink-0">
                <FiUsers className="text-2xl sm:text-3xl" />
              </div>
            </div>
          </div>

          {/* Purchases */}
          <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl border border-gray-100 p-5 sm:p-6 group hover:-translate-y-1 transition-all duration-300">
            <div className="absolute right-0 top-0 w-24 h-24 bg-blue-100 rounded-full blur-3xl opacity-70"></div>

            <div className="relative flex justify-between items-start">
              <div>
                <p className="uppercase tracking-widest text-xs text-gray-500 font-medium">
                  Purchases
                </p>
                <h1 className="text-2xl sm:text-3xl font-black text-gray-800 mt-3">
                  {totalPurchases}
                </h1>
              </div>

              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-blue-100 flex items-center justify-center flex-shrink-0">
                <FiShoppingBag className="text-blue-600 text-2xl sm:text-3xl" />
              </div>
            </div>
          </div>

          {/* Revenue */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-600 via-green-500 to-lime-500 text-white shadow-2xl p-5 sm:p-6 group sm:col-span-2 lg:col-span-1">
            <div className="absolute -right-8 -bottom-8 w-36 h-36 rounded-full bg-white/10"></div>
            <div className="absolute left-0 top-0 w-28 h-28 rounded-full bg-black/10 blur-xl"></div>

            <div className="relative flex justify-between items-start">
              <div>
                <p className="uppercase tracking-widest text-xs text-green-100 font-medium">
                  Revenue
                </p>
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-black mt-3">
                  Ksh {totalSales?.toLocaleString()}
                </h1>
              </div>

              <div className="bg-white/20 p-3 sm:p-4 rounded-2xl backdrop-blur flex-shrink-0">
                <FiDollarSign className="text-3xl sm:text-4xl" />
              </div>
            </div>
          </div>

        </div>

        {/* ============================ MAIN ============================= */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ================= LEFT (CUSTOMERS LIST) ================= */}
          <div className="bg-white rounded-xl shadow-xl flex flex-col">
            <div className="border-b p-4 sm:p-5 flex justify-between items-center gap-2">
              <h2 className="font-bold text-base sm:text-lg">
                Customers
              </h2>

              <button
                onClick={() => setShowNewModal(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 sm:px-4 py-1.5 rounded-xl flex items-center gap-1.5 text-sm font-medium transition-colors"
              >
                <FiPlus />
                New
              </button>
            </div>

            <div className="p-4 sm:p-5">
              <div className="relative mb-4">
                <FiSearch className="absolute top-3 left-3 text-gray-400" />
                <input
                  placeholder="Search customer..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full border rounded-lg py-2 pl-10 pr-3 text-sm outline-none focus:ring-2 focus:ring-blue-600 transition-all"
                />
              </div>

              <div className="space-y-3 max-h-[500px] lg:max-h-[650px] overflow-y-auto pr-1">
                {filteredCustomers.map((customer) => (
                  <div
                    key={customer.id}
                    onClick={() => setSelectedId(customer.id)}
                    className={`cursor-pointer rounded-xl border p-3.5 sm:p-4 transition ${selectedCustomer?.id === customer.id
                        ? "bg-blue-600 text-white border-blue-600 shadow-md"
                        : "bg-white hover:bg-blue-50 border-gray-100"
                      }`}
                  >
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0">
                        <h2 className="font-bold text-sm sm:text-base truncate">
                          {customer.name}
                        </h2>
                        <p className="text-xs sm:text-sm opacity-80 truncate">
                          {customer.phone}
                        </p>
                      </div>

                      <div className="text-right flex-shrink-0">
                        <h2 className="font-bold text-sm sm:text-base">
                          Ksh {customer.totalSpent?.toLocaleString()}
                        </h2>
                        <p className="text-xs opacity-80">
                          {customer.purchases} Purchases
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ================= RIGHT (DETAILS & HISTORY) ================= */}
          <div className="lg:col-span-2 space-y-6">
            {selectedCustomer ? (
              <>
                {/* Customer Information Card */}
                <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b sm:border-0 pb-4 sm:pb-0">
                    <div>
                      <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                        {selectedCustomer.name}
                      </h1>
                      <p className="text-xs sm:text-sm text-gray-500 mt-1">
                        Customer Information
                      </p>
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3">
                      <button
                        onClick={openEditModal}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 sm:px-4 py-2 rounded-xl flex items-center gap-1.5 text-sm font-medium transition-colors"
                      >
                        <FiEdit2 />
                        Edit
                      </button>
                      <button
                        onClick={() =>{customerDeletesetID(selectedCustomer.id), setShowDeleteModal(true)}}
                        className="bg-red-600 hover:bg-red-700 text-white px-3 sm:px-4 py-2 rounded-xl flex items-center gap-1.5 text-sm font-medium transition-colors"
                      >
                        <FiTrash2 />
                        Delete
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6">
                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FiPhone className="text-blue-600 text-lg flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-xs text-gray-500 font-medium">Phone</p>
                        <h3 className="text-sm font-semibold text-gray-800 truncate">{selectedCustomer.phone}</h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FiCalendar className="text-blue-600 text-lg flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Joined</p>
                        <h3 className="text-sm font-semibold text-gray-800">{selectedCustomer.joined}</h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FiShoppingBag className="text-blue-600 text-lg flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Purchases</p>
                        <h3 className="text-sm font-semibold text-gray-800">{selectedCustomer.purchases}</h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <FiDollarSign className="text-green-600 text-lg flex-shrink-0" />
                      <div>
                        <p className="text-xs text-gray-500 font-medium">Spent</p>
                        <h3 className="text-sm font-semibold text-gray-800">
                          Ksh {selectedCustomer.totalSpent?.toLocaleString()}
                        </h3>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Purchase History Table Card */}
                <div className="bg-white rounded-xl shadow-xl p-5 sm:p-6">
                  <h2 className="font-bold text-lg sm:text-xl mb-4 text-gray-800">
                    Purchase History
                  </h2>

                  <div className="overflow-x-auto rounded-lg border border-gray-100">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-blue-600 text-white font-medium uppercase text-xs tracking-wider">
                        <tr>
                          <th className="p-3 whitespace-nowrap">Invoice</th>
                          <th className="p-3 whitespace-nowrap">Date</th>
                          <th className="p-3 text-center whitespace-nowrap">Items</th>
                          <th className="p-3 text-right whitespace-nowrap">Amount</th>
                          <th className="p-3 text-center whitespace-nowrap">Receipt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {selectedCustomer.history?.map((sale, index) => (
                          <tr
                            key={index}
                            className="hover:bg-blue-50/50 transition-colors"
                          >
                            <td className="p-3 font-medium text-gray-900 whitespace-nowrap">{sale.invoice}</td>
                            <td className="p-3 text-gray-600 whitespace-nowrap">{sale.date}</td>
                            <td className="p-3 text-center text-gray-600 whitespace-nowrap">{sale.items}</td>
                            <td className="p-3 text-right font-medium text-gray-900 whitespace-nowrap">
                              Ksh {sale.amount?.toLocaleString()}
                            </td>
                            <td className="p-3 text-center whitespace-nowrap">
                              <button
                                className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-3 py-1 text-xs font-medium transition-colors"
                                onClick={() => openReceiptModal(sale)}
                              >
                                View Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </>
            ) : (
              <div className="bg-white rounded-xl shadow-xl p-8 sm:p-12 flex flex-col items-center justify-center text-center">
                <FiUser size={60} className="text-blue-500 mb-4" />
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">No Customer Selected</h2>
                <p className="text-sm text-gray-500 mt-2 max-w-sm">
                  Add a new customer or select one from the customer list on the left to view details.
                </p>
              </div>
            )}
          </div>

        </div>
      </div>
      {/* ================= NEW CUSTOMER MODAL ================= */}
      {showNewModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
          <div
            className={`p-6 rounded-xl shadow-lg w-96 mx-4
                ${theme === "Dark" ? "bg-[#171941]" : "bg-white"}
            `}
          >
            <h2 className="text-md sm:text-lg font-bold mb-5 text-center">
              New Customer
            </h2>

            <div className="space-y-3">

              {/* CUSTOMER NAME */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-600">
                  Customer Name
                </label>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter customer name"
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#303133] pl-12 shadow-md text-sm sm:text-base"
                    style={{ color: "#000000" }}
                    value={form.name}
                    onChange={(e) =>
                      setForm({ ...form, name: e.target.value })
                    }
                  />

                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-black text-lg" />
                </div>
              </div>

              {/* PHONE */}
              <div>
                <label className="text-xs sm:text-sm font-medium text-gray-600">
                  Phone Number
                </label>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Enter phone number"
                    className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#303133] pl-12 shadow-md text-sm sm:text-base"
                    style={{ color: "#000000" }}
                    value={form.phone}
                    onChange={(e) =>
                      setForm({ ...form, phone: e.target.value })
                    }
                  />

                  <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-black text-lg" />
                </div>
              </div>

            </div>

            {/* ACTION BUTTONS */}
            <div className="flex justify-evenly mt-6">

              <button
                onClick={handleAddCustomer}
                className={`px-5 py-2 rounded text-white font-medium text-xs sm:text-sm
                        ${theme === "Dark"
                    ? "bg-green-800 hover:bg-green-600"
                    : "bg-green-600 hover:bg-green-800"
                  }
                    `}
              >
                Save Customer
              </button>

              <button
                onClick={() => setShowNewModal(false)}
                className={`px-5 py-2 rounded text-white font-medium text-xs sm:text-sm
                        ${theme === "Dark"
                    ? "bg-red-800 hover:bg-red-600"
                    : "bg-red-600 hover:bg-red-800"
                  }
                    `}
              >
                Cancel
              </button>

            </div>
          </div>
        </div>
      )}




      {
        showEditModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
            <div
              className={`p-6 rounded-xl shadow-lg w-96 mx-4
                    ${theme === "Dark" ? "bg-[#171941]" : "bg-white"}
                `}
            >
              <h2 className="text-md sm:text-lg font-bold mb-5 text-center">
                Edit Customer
              </h2>

              <div className="space-y-3">

                {/* CUSTOMER NAME */}
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-600">
                    Customer Name
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter customer name"
                      className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#303133] pl-12 shadow-md text-sm sm:text-base"
                      style={{ color: "#000000" }}
                      value={editForm.name}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          name: e.target.value,
                        })
                      }
                    />

                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-black text-lg" />
                  </div>
                </div>

                {/* PHONE */}
                <div>
                  <label className="text-xs sm:text-sm font-medium text-gray-600">
                    Phone Number
                  </label>

                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Enter phone number"
                      className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#303133] pl-12 shadow-md text-sm sm:text-base"
                      style={{ color: "#000000" }}
                      value={editForm.phone}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          phone: e.target.value,
                        })
                      }
                    />

                    <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-black text-lg" />
                  </div>
                </div>



              </div>

              {/* ACTION BUTTONS */}
              <div className="flex justify-evenly mt-6">

                <button
                  onClick={updateCustomer}
                  className={`px-5 py-2 rounded text-white font-medium text-xs sm:text-sm
                            ${theme === "Dark"
                      ? "bg-green-800 hover:bg-green-600"
                      : "bg-green-600 hover:bg-green-800"
                    }
                        `}
                >
                  Update Customer
                </button>

                <button
                  onClick={() => setShowEditModal(false)}
                  className={`px-5 py-2 rounded text-white font-medium text-xs sm:text-sm
                            ${theme === "Dark"
                      ? "bg-red-800 hover:bg-red-600"
                      : "bg-red-600 hover:bg-red-800"
                    }
                        `}
                >
                  Cancel
                </button>

              </div>
            </div>
          </div>
        )
      }

      {
        showDeleteModal && (

          <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">

            <div className="bg-white rounded-xl shadow-xl max-w-md w-full">

              <div className="p-8 text-center">

                <div className="mx-auto w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mb-5">

                  <FiTrash2
                    size={40}
                    className="text-red-600"
                  />

                </div>

                <h1 className="text-xl font-bold">
                  Delete Customer?
                </h1>

                <p className="text-gray-500 mt-3">

                  Are you sure you want to delete ??

                </p>

                <div className="flex gap-4 mt-8">

                  <button

                    onClick={() => setShowDeleteModal(false)}

                    className="flex-1 bg-gray-300 py-3 rounded-lg"

                  >

                    Cancel

                  </button>

                  <button

                    onClick={deleteCustomer}

                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-3 rounded-lg"

                  >

                    Delete

                  </button>

                </div>

              </div>

            </div>

          </div>

        )

      }

      {/* ================= RECEIPT MODAL ================= */}
      {showReceiptModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50 overflow-y-auto py-6">

          <div
            className="p-4 shadow w-[380px] font-sans text-sm print-area receipt-container bg-white text-black rounded-lg"
          >
            <div className="text-center ">
              <p className="font-bold text-xl font-extrabold tracking-tight uppercase font-sans">
                {bizName}
              </p>
              <p className="font-semibold text-sm">Email : {bizEmail}</p>
              <p className="font-semibold text-md">TEL : {bizPhone} </p>
            </div>

            <div className="border-t border-dotted border-black/20 mt-1"></div>

            {/* Cash Sale Header */}
            <div className="text-center font-bold text-lg mb-2">CASH SALE</div>
            <div className="border-t border-dotted border-black/20"></div>
            <div className="flex justify-between mb-2 font-bold">
              <div>
                <p className="text-sm ">M/S: {selectedCustomer?.name}</p>
                <p className="text-xs font-normal">Served by: {receipt.cashier}</p>
              </div>
              <div>
                <p className="text-sm">Cash Sale #: {receipt.receiptNumber}</p>
              </div>
            </div>

            <div className="flex justify-between mb-2">
              <p className="text-sm">Date: {receipt.dateOnly}</p>
              <p className="text-sm ">Time:<span className="text-sm mx-2"> {receipt.timeOnly}</span></p>
            </div>
            <div className="border-t border-dotted border-black/20"></div>
            <div>
              <div className="flex justify-between font-bold text-sm">
                <div className="w-1/2">ITEM</div>
                <div className="grid grid-cols-2 gap-4 w-40 text-right">
                  <span>PRICE</span>
                  <span>AMOUNT</span>
                </div>
              </div>
              <div className="border-t border-dotted border-black/20"></div>

              <div className="bg-white text-black">
                {receipt.cartItems.map((item, i) => (
                  <div key={i} className="py-1">
                    <div className="flex justify-between font-bold">
                      <div className="font-sm">{item.Name}</div>
                      <div className="text-xs">{item.vatCode || "A"}</div>
                    </div>
                    <div className="flex justify-between">
                      <div className="text-xs">
                        <span className="ml-8 text-sm ">
                          Qty : {parseFloat(item.stock || 0).toFixed(0)}
                        </span>
                      </div>
                      <div>
                        <div className="grid grid-cols-2 gap-4 w-40 text-right">
                          <span>{Number(item.Price || 0).toLocaleString()}</span>
                          <span>
                            {(
                              (parseInt(item.stock) || 0) * (parseInt(item.Price) || 0)
                            ).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-dotted border-black/20"></div>
                  </div>
                ))}
              </div>

              <div className="border-t border-dotted border-black/20"></div>

              <div className=" my-2" />
              <div className="flex justify-between font-bold text-lg">
                <span>TOTAL:</span>
                <span>{formatNumber(receipt.total)}</span>
              </div>
              <div className="border-t border-dotted border-black/20"></div>
              <div className="flex justify-between font-bold text-lg">
                <span>CASH:</span>
                <span>{formatNumber(receipt.total)}</span>
              </div>
              <div className="border-t border-dotted border-black/20"></div>
              <div className="flex justify-between font-bold text-lg">
                <span>CHANGE:</span>
                <span>0.00</span>
              </div>
            </div>
            <div className="border-t border-dotted border-black/20"></div>

            {/* Footer Summary */}
            <div className="text-xs space-y-1">
              <p className="flex items-center font-bold">
                <strong className="flex-1">TOTAL ITEMS:</strong>
                <span className="text-center w-40 mr-7">{receipt.totalItems}</span>
              </p>
              <div className="border-t border-dotted border-black/20"></div>
              <p className="flex items-center font-bold">
                <strong className="flex-1">TOTAL QTY:</strong>
                <span className="text-center w-40 mr-7">{receipt.totalQty}</span>
              </p>
              <div className="border-t border-dotted border-black/20"></div>
              <p className="flex items-center font-bold">
                <span className="text-center w-40 mr-7">{formatNumber(receipt.totalWeight)}</span>
              </p>
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
                    <div key={code} className="contents">
                      <p className="col-span-1 text-left font-bold">{code}</p>
                      <p className="col-span-1 text-right font-bold">
                        {formatNumber(receipt.vatBreakdown[code].vatable - receipt.vatBreakdown[code].vat)}
                      </p>
                      <p className="col-span-1 text-right font-bold">
                        {formatNumber(receipt.vatBreakdown[code].vat)}
                      </p>
                      <p className="col-span-1 text-right font-bold">
                        {formatNumber(receipt.vatBreakdown[code].vatable)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t border-dotted border-black/20"></div>
              <p className="mt-2 font-semibold">VAT CODE:(A)=VATABLE, (E)=EXEMPT, (Z)=ZERO RATED</p>
              <p className="font-semibold">PRICES INCLUSIVE OF VAT WHERE APPLICABLE</p>
              <div className="border-t border-dotted border-black/20"></div>
              <div className="border-t border-dotted border-black/20"></div>
              <p className="font-bold">YOU WERE SERVED BY : {receipt.cashier}</p>
              <div className="border-t border-dotted border-black/20"></div>
              <div className="border-t border-dotted border-black/20"></div>
              <div className="text-xm text-center font-bold">
                <p>GOODS ONCE SOLD CANNOT BE ACCEPTED</p>
                <p>BACK FOR REFUND OR ANY OTHER REASON</p>
              </div>
              <div className="border-t border-dotted border-black/20"></div>
              <div className="border-t border-dotted border-black/20"></div>
              <div className="border-t border-dotted border-black/20"></div>

              {/* QR Code */}
              <div className="flex justify-center my-3">
                <QRCodeSVG
                  value={JSON.stringify({
                    invoice: receipt.receiptNumber,
                    totalItems: receipt.totalItems,
                    totalQty: receipt.totalQty,
                    totalWeight: receipt.totalWeight.toFixed(2),
                    totalVAT: receipt.vatBreakdown.A.vat.toFixed(2),
                    totalAmount: (
                      receipt.vatBreakdown.A.vatable + receipt.vatBreakdown.A.vat
                    ).toFixed(2),
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
              <p>Thank You......Come Again.</p>
            </div>

            <div className="no-print flex flex-row justify-evenly mt-4">
              <button
                className="text-white px-4 py-2 rounded bg-green-600 hover:bg-green-800"
                onClick={() => window.print()}
              >
                Print
              </button>
              <button
                className="text-white px-4 py-2 rounded bg-red-600 hover:bg-red-800"
                onClick={closeReceiptModal}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {customers.length === 0 && (

        <div className="flex flex-col justify-center items-center py-24">

          <FiUsers
            size={90}
            className="text-blue-500 mb-5"
          />

          <h2 className="text-3xl font-bold">
            No Customers
          </h2>

          <p className="text-gray-500 mt-2">
            Add your first customer.
          </p>

          <button

            onClick={() => setShowNewModal(true)}

            className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-6 py-3 mt-8"

          >

            + New Customer

          </button>

        </div>

      )

      }



    </div>
  );
};

export default Customers;
