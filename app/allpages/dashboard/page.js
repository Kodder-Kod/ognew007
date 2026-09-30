"use client"
import axios from 'axios';
import React, { useState, useEffect, useMemo } from "react";
import { ref, push, update } from 'firebase/database';
import { MdEmail } from "react-icons/md"
import { db, } from "../../../config";
import { FaUser, FaTerminal, FaClock, FaBox, FaList, FaFile, FaEject, FaProductHunt, FaBoxOpen, FaExpand, FaFolder, FaTags } from "react-icons/fa";
import { useUserCategories } from "@/app/componets/zustand/categories";
import { useUserAccountName, useUserEmail, useUserID, useUserName, useUserPhone } from "@/app/componets/zustand/profile";
import { useUserItems, useUserItemsData } from "@/app/componets/zustand/items";
import { useUserEmployee } from "@/app/componets/zustand/employees";
import itemsdata from "@/app/data/items";
import categoriesdata from "@/app/data/categories";
import { useUserTheme } from "@/app/componets/zustand/theme";
import { TbXboxX } from "react-icons/tb";
import { TiTick } from "react-icons/ti";
import { QRCodeSVG } from 'qrcode.react';
import { useUserCartReceipt, useUserCartTotalReceipt } from "@/app/componets/zustand/receipt";
import { FaCashRegister } from "react-icons/fa";
import { useUserCustomers } from '@/app/componets/zustand/customers';
import { useUserCart } from '@/app/componets/zustand/cart';



const Dashboard = () => {

  const [paymentType, setPaymentType] = useState("Full"); // "Full" | "Partial"
  const [paymentMode, setPaymentMode] = useState("Single"); // "Single" | "Split"

  const [amountPaid, setAmountPaid] = useState(""); // used only when Partial
  const [multiPayments, setMultiPayments] = useState([{ method: "cash", amount: "" }]); // used when Split
  const [deliveryFee, setDeliveryFee] = useState(0);

  //// Zustand 
  const Id = useUserID((state) => state.userID)
  const categories = useUserCategories((state) => state.userCategories)
  const items = useUserItems((state) => state.userItems)
  const customersState = useUserCustomers((state) => state.userCustomers);
  const customers = Array.isArray(customersState) ? customersState : [];

  const bizName = useUserName((state) => state.userName)
  const userAccountName = useUserAccountName((state) => state.userAccountName)

  const bizEmail = useUserEmail((state) => state.userEmail)
  const bizPhone = useUserPhone((state) => state.userPhone)

  const employees = useUserEmployee((state) => state.userEmployee)

  const theme = useUserTheme((state) => state.userTheme)


  const [paymentMethod, setPaymentMethod] = useState("");
  const [paymentError, setPaymentError] = useState("");


  const [customerSelect, setCustomerSelect] = useState("");




  // State to track the selected category
  const [selectedCategory, setSelectedCategory] = useState("");

  /////// Select box   mostly for employees
  const [selectEmployee, setSelectEmployee] = useState("");
  const [ticketName, setTicketName] = useState('');

  /// Cart functions 
  const [cart, setCart] = useState([]);
  const [total, setTotal] = useState(0);



  const [searchTerm, setSearchTerm] = useState("");

  const selectCat = (catname) => {
    if (catname === selectedCategory) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(catname);
    }

    // Clear search when selecting category
    setSearchTerm("");
  };


  let filteredItems = items || [];

  // Search overrides category completely
  if (searchTerm.trim() !== "") {

    const q = searchTerm.toLowerCase();

    filteredItems = (items || []).filter((item) =>
      (item.Name || "").toLowerCase().includes(q)
    );

  } else if (selectedCategory) {

    filteredItems = filteredItems.filter(
      (item) => item.Category === selectedCategory
    );
  }


  ///// Modals
  const [ticketModal, setTicketModal] = useState(false)
  const [receiptDetailsModal, setreceiptDetailsModal] = useState(false)
  const [sendModal, setSendModal] = useState(false);
  const [receiptModal, setReceiptModal] = useState(false);


  const receiptModalFun = () => setReceiptModal(false);

const sendModalFun = () => {
  setSelectEmployee("");
  setTicketName('');
  setCustomerSelect('');

  // Payment type/mode — back to defaults
  setPaymentType('Full');
  setPaymentMode('Single');

  // Single-method fields
  setPaymentMethod('');
  setAmountPaid('');

  // Split-method fields — reset to one blank row
  setMultiPayments([
    {
      method: 'cash',
      amount: '',
    },
  ]);

  // Validation error
  setPaymentError('');

  // Delivery fee
  setDeliveryFee(0);

  setSendModal(false);
};

  const ticketModalFun = () => {
    setTicketName('')
    setSelectEmployee("")

    setTicketModal(false);

  setSelectEmployee("");
  setTicketName('');
  setCustomerSelect('');

  // Payment type/mode — back to defaults
  setPaymentType('Full');
  setPaymentMode('Single');

  // Single-method fields
  setPaymentMethod('');
  setAmountPaid('');

  // Split-method fields — reset to one blank row
  setMultiPayments([
    {
      method: 'cash',
      amount: '',
    },
  ]);

  // Validation error
  setPaymentError('');

  // Delivery fee
  setDeliveryFee(0);

  setSendModal(false);

    
  }

  const [phoneNumber, setPhoneNumber] = useState('');
  const [sendMpesa, setSendMpesa] = useState(false);
  const sendMpesaFun = () => {
    setSelectEmployee("")
    setTicketName('')
    setSendMpesa(false);
  }


  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("total:", total, "type:", typeof total);
    console.log("total:", phoneNumber, "type:", typeof phoneNumber);

    try {
      await axios.post('/api/mpesa', { phoneNumber, total });
      //  setMessage("STK Push sent. Enter PIN on your phone!");
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Payment failed.';
      console.log(err.response?.data?.message)

    } finally {
      console.log("finally")
      //  setLoading(false);
    }
  };


  const receiptDetailsModalFun = () => {

    setreceiptDetailsModal(false);
  }

  /////receipt details modal 
  const [receiptName, setReceiptName] = useState('');
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedTime, setSelectedTime] = useState("");

  const [receiptNumber, setReceiptNumber] = useState("")

  useEffect(() => {
    const now = new Date();

    const formattedDate = now.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: '2-digit',
    });

    const formattedTime = now.toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    const receiptNumber1 = 'MRCS' + Math.floor(100000 + Math.random() * 900000); // Example generator

    setReceiptNumber(receiptNumber1)
    setSelectedDate(formattedDate);
    setSelectedTime(formattedTime);
  }, []);


  const receiptDetailsClose = () => {
    setReceiptModal(true);

    setreceiptDetailsModal(false)
  }

  // const cart = useUserCartReceipt((state) => state.userCartReceipt)


  const addToCart = (item) => {
    const unlimited = item.Stock == "N/A";

    // If stock is numbered and zero → block
    if (!unlimited && item.Stock <= 0) {
      itemOutStockFun();
      return;
    }

    const existingItem = cart.find(
      (cartItem) => cartItem.Name === item.Name
    );

    if (existingItem) {
      // Numbered stock limit check
      if (!unlimited && existingItem.stock >= item.Stock) {
        itemMaxFun();
        return;
      }

      setCart(
        cart.map((cartItem) =>
          cartItem.Name === item.Name
            ? { ...cartItem, stock: cartItem.stock + 1 }
            : cartItem
        )
      );
    } else {
      setCart([...cart, { ...item, stock: 1 }]);
    }

    setTotal(total + parseFloat(item.Price));
  };

  const handleIncrease = (item) => {
    const unlimited = item.Stock == "N/A";

    if (!unlimited && item.stock >= item.Stock) {
      itemMaxFun();
      return;
    }

    setCart(
      cart.map((cartItem) =>
        cartItem.Name === item.Name
          ? { ...cartItem, stock: cartItem.stock + 1 }
          : cartItem
      )
    );

    setTotal(total + parseFloat(item.Price));
  };


  const handleDecrease = (item) => {
    if (item.stock > 1) {
      setCart(
        cart.map((cartItem) =>
          cartItem.Name === item.Name
            ? { ...cartItem, stock: cartItem.stock - 1 }
            : cartItem
        )
      );
      setTotal(total - parseFloat(item.Price));
    } else {
      handleRemove(item);
    }
  };

  const handleRemove = (item) => {
    setCart(cart.filter((cartItem) => cartItem.Name !== item.Name));
    setTotal(total - parseFloat(item.Price) * item.stock)

  };


  ///ticket////

  const handleticket = () => {
    if (Id) {
      if (cart && customerSelect) {
        const subtotal = Number(total) || 0;

        if (subtotal === 0) {
          console.log("total is zero");
          ticketfailTotal();
          return;
        }

        const delivery = Number(deliveryFee) || 0;
        const grandTotal = subtotal + delivery;

        // ---- Paid part: optional. Blank/zero means fully on credit. ----
        let paidNow = 0;
        let paymentsRecord = [];

        if (paymentMode === "Single") {
          const amt = Number(amountPaid) || 0;
          if (amt > 0) {
            if (!paymentMethod) {
              setPaymentError("Select a payment method for the amount being paid now.");
              return;
            }
            paymentsRecord = [{ method: paymentMethod, amount: amt }];
            paidNow = amt;
          }
          // amt === 0 → leave paymentsRecord empty, nothing paid yet
        } else {
          const cleaned = multiPayments
            .filter((p) => p.method && Number(p.amount) > 0)
            .map((p) => ({ method: p.method, amount: Number(p.amount) }));

          paymentsRecord = cleaned;
          paidNow = cleaned.reduce((sum, p) => sum + p.amount, 0);
        }

        const balance = Math.max(grandTotal - paidNow, 0);

        console.log("total is zero", customerSelect);
        try {
          const dbRef = ref(db, `web/pos/${Id}/ticket/`);
          const newbranchRef = push(dbRef, {

            Name: ticketName,
            EmployeeID: userAccountName,
            Customer: customerSelect,
            Cart: cart,
            Total: subtotal,
            DeliveryFee: delivery,
            GrandTotal: grandTotal,

            // ---- paid part ----
            PaymentMode: paymentMode,
            Payments: paymentsRecord,   // [] if nothing paid yet
            AmountPaid: paidNow,        // 0 if pure credit
            Balance: balance,

            Date: Date.now()

          });
          const newCreditKey = newbranchRef.key;

          ticketModalFun()
          handleCancel()
          ticketSuccess()
          updateStockInDatabase(Id);

        }
        catch {
          console.log("did not send to DB")
          ticketModalFun()
          ticketFail()
        }
      }
      else {
        console.log("did not select employee ")
        ticketModalFun()
        ticketFailEmployee()
      }
    }
  };

  const generateRandomHex = () => {
    const receiptNumber1 = 'MRCS' + Math.floor(100000 + Math.random() * 900000);
    return receiptNumber1;
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


  const handleConfirmSell = () => {
    // Only Single mode uses paymentMethod — Split uses multiPayments instead.
    // Don't gate on paymentMethod when in Split mode.
    if (paymentMode === "Single" && !paymentMethod) {
      setPaymentError("Please select a payment method");
      return; // ❌ stop here, modal stays open
    }

    setPaymentError(""); // clear error
    handleSend();        // ✅ proceed
  };


  const handleSend = () => {
    if (!Id) {
      console.log("did not select employee");
      sendModalFun();
      sendFailEmployee();
      return;
    }

    if (!cart || cart.length === 0) {
      console.log("cart is empty");
      sendModalFun();
      sendFailTotal();
      return;
    }

    const subtotal = Number(total) || 0;

    if (subtotal === 0) {
      console.log("total is zero");
      sendFailTotal();
      return;
    }

    const delivery = Number(deliveryFee) || 0;
    const grandTotal = subtotal + delivery;

    // ---- Partial sales must be tied to a customer (for credit tracking) ----
    if (paymentType === "Partial" && !customerSelect) {
      setPaymentError("Select a customer to record credit.");
      return;
    }

    // ---- Work out how much is being paid now, and build the payments record ----
    let paidNow = 0;
    let paymentsRecord = null;

    if (paymentMode === "Single") {
      if (!paymentMethod) {
        setPaymentError("Select a payment method.");
        return;
      }

      // Full payment: amount is always the grand total — no manual entry to validate.
      // Partial payment: use whatever was typed into Amount Paying Now.
      paidNow =
        paymentType === "Full" ? grandTotal : Number(amountPaid) || 0;

      if (paymentType === "Partial" && paidNow <= 0) {
        setPaymentError("Enter a valid amount.");
        return;
      }

      paymentsRecord = [{ method: paymentMethod, amount: paidNow }];
    } else {
      // Split payments
      const cleaned = multiPayments
        .filter((p) => p.method && Number(p.amount) > 0)
        .map((p) => ({ method: p.method, amount: Number(p.amount) }));

      if (cleaned.length === 0) {
        setPaymentError("Enter at least one valid split payment.");
        return;
      }

      paidNow = cleaned.reduce((sum, p) => sum + p.amount, 0);
      paymentsRecord = cleaned;
    }

    // ---- Full payment must actually cover the grand total ----
    if (paymentType === "Full" && paidNow < grandTotal) {
      setPaymentError(
        `Amount paid (Ksh ${paidNow.toFixed(2)}) is less than the total (Ksh ${grandTotal.toFixed(2)}). Switch to Partial, or fix the amount.`
      );
      return;
    }

    const balance = Math.max(grandTotal - paidNow, 0);
    const change = Math.max(paidNow - grandTotal, 0);
    const profit = calculateOrderProfit(cart);

    try {
      const hexTicket = generateRandomHex();
      const dbRef = ref(db, `web/pos/${Id}/cart/`);

      push(dbRef, {
        EmployeeID: userAccountName,
        CashSale: hexTicket,
        Cart: cart,

        Total: subtotal,          // items only — matches how Reports.js reads item.Total today
        DeliveryFee: delivery,
        GrandTotal: grandTotal,   // items + delivery, what the customer actually owed

        Customer: customerSelect || null,
        PaymentType: paymentType, // "Full" | "Partial"
        PaymentMode: paymentMode, // "Single" | "Split"
        Payments: paymentsRecord, // [{ method, amount }, ...] — always an array now, even for Single
        AmountPaid: paidNow,
        Balance: balance,
        Change: change,

        Profit: profit,

        Date: Date.now(),
      });

      sendModalFun();
      handleCancel();
      sendSuccess();
      updateStockInDatabase(Id);
    } catch (error) {
      console.log(error);
      sendModalFun();
      sendFail();
    }
  };

  const handleCancel = () => {
    setCart([]);
    useUserCartReceipt.setState({ userCartReceipt: [] })
    setTotal(0);
    useUserCartTotalReceipt.setState({ userCartTotalReceipt: 0 })
  };


  /// Update stock
  const updateStockInDatabase = async (id) => {
    try {
      const updates = {};

      cart.forEach((cartItem) => {
        if (cartItem.Stock === "N/A") {
          // Do not subtract for N/A, keep as N/A
          updates[`web/pos/${id}/items/${cartItem.id}/Stock`] = "N/A";
        } else {
          // Normal numbered stock
          updates[`web/pos/${id}/items/${cartItem.id}/Stock`] = cartItem.Stock - cartItem.stock;
        }
      });

      await update(ref(db), updates);
      console.log("Stock updated successfully");
    } catch (error) {
      console.error("Error updating stock:", error);
    }
  };



  ////  Auto close modals
  const [sendModalSuccess, setSendModalSuccess] = useState(false);
  const [sendModalFail, setSendModalFail] = useState(false);
  const [sendModalFailEmployee, setSendModalFailEmployee] = useState(false);
  const [sendModalFailTotal, setSendModalFailTotal] = useState(false);

  const sendSuccess = () => {
    setSendModalSuccess(true);
    setTimeout(() => setSendModalSuccess(false), 1500);
  };

  const sendFail = () => {
    setSendModalFail(true);
    setTimeout(() => setSendModalFail(false), 1500);
  };

  const sendFailTotal = () => {
    setSendModalFailTotal(true);
    setTimeout(() => setSendModalFailTotal(false), 1500);
  };

  const sendFailEmployee = () => {
    setSendModalFailEmployee(true);
    setTimeout(() => setSendModalFailEmployee(false), 1500);
  };


  const [ticketModalSuccess, setTicketModalSuccess] = useState(false);
  const [ticketModalFail, setTicketModalFail] = useState(false);
  const [ticketModalFailEmployee, setTicketModalFailEmployee] = useState(false);
  const [ticketModalFailTotal, setTicketModalFailTotal] = useState(false);

  const ticketSuccess = () => {
    setTicketModalSuccess(true);
    setTimeout(() => setTicketModalSuccess(false), 1500);
  };

  const ticketFail = () => {
    setTicketModalFail(true);
    setTimeout(() => setTicketModalFail(false), 1500);
  };

  const ticketfailTotal = () => {
    setTicketModalFailTotal(true);
    setTimeout(() => setTicketModalFailTotal(false), 1500);
  };

  const ticketFailEmployee = () => {
    setTicketModalFailEmployee(true);
    setTimeout(() => setTicketModalFailEmployee(false), 1500);
  };



  const [itemMaxFail, setItemMaxModalFail] = useState(false);
  const [ItemOutStockFail, setItemOutStockModalFail] = useState(false);


  const itemMaxFun = () => {
    setItemMaxModalFail(true);
    setTimeout(() => setItemMaxModalFail(false), 1000);
  };

  const itemOutStockFun = () => {
    setItemOutStockModalFail(true);
    setTimeout(() => setItemOutStockModalFail(false), 1000);
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

  const format = (val) => val.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  const [sortConfig, setSortConfig] = useState({ key: "Name", direction: "asc" });

  const handleSort = (key) => {
    let direction = "asc";
    if (sortConfig.key === key && sortConfig.direction === "asc") {
      direction = "desc";
    }
    setSortConfig({ key, direction });
  };



  const sortedItems = React.useMemo(() => {
    if (!filteredItems) return [];

    if (!sortConfig.key) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      const { key, direction } = sortConfig;

      if (key === "Name") {
        if (a[key] < b[key]) return direction === "asc" ? -1 : 1;
        if (a[key] > b[key]) return direction === "asc" ? 1 : -1;
        return 0;
      } else {
        // numeric sorting for Stock or Price
        return direction === "asc"
          ? a[key] - b[key]
          : b[key] - a[key];
      }
    });
  }, [filteredItems, sortConfig]);



  const handlePriceChange = (index, value) => {
    const updatedCart = [...cart];

    updatedCart[index].Price = Number(value);

    setCart(updatedCart);
  };
  const [cartTotal, setCartTotal] = useState(0);

  useEffect(() => {
    const total = cart.reduce(
      (acc, item) => acc + (Number(item.Price || 0) * Number(item.stock || 0)),
      0
    );
    setCartTotal(total);
    setTotal(total)
  }, [cart]);





  ///////////////////////////////////////////////////////////////////////////////////////

  // ====================== HELPERS (place ABOVE the component, or at the very top inside it) ======================

  const toArray = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    return Object.entries(data).map(([id, value]) => ({ id, ...value }));
  };

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

  const saleBelongsToCustomer = (sale, customer) => {
    if (!sale?.Customer) return false;
    const saleCustomer = sale.Customer;
    if (typeof saleCustomer === "object") {
      return saleCustomer.id === customer.id || saleCustomer.Name === customer.Name;
    }
    return saleCustomer === customer.id || saleCustomer === customer.Name;
  };

  // ====================== INSIDE THE COMPONENT, in this order ======================

  const [showDeliveryModal, setShowDeliveryModal] = useState(false);
  const [showCustomerPricesModal, setShowCustomerPricesModal] = useState(false);
  const [customerPriceSearch, setCustomerPriceSearch] = useState("");

  const deliveryFees = [
    { distance: "1 km", fee: 50 },
    { distance: "2 km", fee: 100 },
    { distance: "3 km", fee: 150 },
    { distance: "5 km", fee: 220 },
    { distance: "10 km", fee: 400 },
    { distance: "15+ km", fee: 600 },
  ];

  const rawCustomersData = useUserCustomers((state) => state.userCustomers);
  const rawSalesHistory = useUserCart((state) => state.userCart);

  const customersArray = useMemo(() => toArray(rawCustomersData), [rawCustomersData]);
  const salesArray = useMemo(() => toArray(rawSalesHistory), [rawSalesHistory]);

  // For each customer, for each item they've bought, keep only the most
  // recent price they paid (kila customer bei yake per item).
  const customerLastPrices = useMemo(() => {
    const result = [];

    customersArray.forEach((customer) => {
      const sales = salesArray
        .filter((sale) => saleBelongsToCustomer(sale, customer))
        .sort((a, b) => (b.Date || 0) - (a.Date || 0)); // newest first

      const seenItems = new Map(); // itemName -> { price, date }

      sales.forEach((sale) => {
        const items = toItemsArray(sale.Cart);
        items.forEach((item) => {
          if (!item?.Name) return;
          if (!seenItems.has(item.Name)) {
            seenItems.set(item.Name, {
              price: Number(item.Price) || 0,
              date: sale.Date,
            });
          }
        });
      });

      seenItems.forEach((val, itemName) => {
        result.push({
          customerName: customer.Name || "Unnamed Customer",
          item: itemName,
          lastPrice: val.price,
          date: formatDate(val.date),
        });
      });
    });

    return result;
  }, [customersArray, salesArray]);

  const filteredCustomerPrices = useMemo(() => {
    return customerLastPrices.filter((row) =>
      row.customerName.toLowerCase().includes(customerPriceSearch.toLowerCase())
    );
  }, [customerLastPrices, customerPriceSearch]);


  return (

    <div className={`min-h-screen flex flex-col"
    ${theme === "Dark"
        ? "text-white "
        : "bg-gray-200 text-black rounded-lg"
      }`}
    >

      {/* Main Layout */}

      {!receiptModal && (

        <>
          <div className="flex flex-col md:flex-row flex-grow rounded">

            {/* Sidebar */}
            <aside className="w-full md:w-1/6 p-4 rounded-lg shadow-xl border-b md:border-b-0 md:border-r">

              <h3 className="sm:text-lg text-sm font-bold mb-4 text-center">
                Categories
              </h3>

              <div className="grid grid-cols-2 md:grid-cols-1 gap-2 px-2 pt-2 overflow-y-auto">
                {categories &&
                  [...categories]
                    .sort((a, b) => a.Name.localeCompare(b.Name))
                    .map((category, index) => (
                      <button
                        key={index}
                        className={`w-full p-3 md:p-5 rounded-xl text-xs md:text-base
            ${theme === "Dark"
                            ? "text-white border border-blue-800 hover:bg-blue-600"
                            : "bg-blue-600 text-white hover:bg-blue-400"
                          }`}
                        onClick={() => selectCat(category.Name)}
                      >
                        {category.Name}
                      </button>
                    ))}
                {!categories && (
                  <div className=" flex-col hidden md:flex items-center justify-center py-12 animate-in fade-in duration-700">
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

            {/* Items */}
            <section className="w-full md:w-1/2 p-4 rounded-lg">

              {/* Title + Search */}
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
                <h3 className="text-sm sm:text-lg font-bold">
                  Items in {selectedCategory}
                </h3>

                <input
                  type="text"
                  placeholder="Search items..."
                  className={`w-full md:w-auto p-2 rounded-xl text-xs sm:text-sm border outline-none
          ${theme === "Dark"
                      ? "bg-[#1e3a8a] text-white border-blue-700 placeholder-gray-300"
                      : "bg-white text-black border-gray-300 placeholder-gray-500"
                    }`}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />

                <div className="flex flex-wrap gap-2 mx-auto">
                  <button
                    className={`px-2 py-1.5  text-xs sm:text-sm md:px-3 md:py-1 md:text-sm rounded-lg
      ${theme === "Dark"
                        ? "text-white border border-blue-800 hover:bg-blue-600"
                        : "bg-blue-600 text-white hover:bg-blue-400"
                      }`}
                    onClick={() => handleSort("Name")}
                  >
                    Name {sortConfig.key === "Name"
                      ? (sortConfig.direction === "asc" ? "▲" : "▼")
                      : ""}
                  </button>

                  <button
                    className={`px-2 py-1.5 text-xs sm:text-sm md:px-3 md:py-1 md:text-sm rounded-lg
      ${theme === "Dark"
                        ? "text-white border border-blue-800 hover:bg-blue-600"
                        : "bg-blue-600 text-white hover:bg-blue-400"
                      }`}
                    onClick={() => handleSort("Stock")}
                  >
                    Stock {sortConfig.key === "Stock"
                      ? (sortConfig.direction === "asc" ? "▲" : "▼")
                      : ""}
                  </button>

                  <button
                    className={`px-2 py-1.5  text-xs sm:text-sm md:px-3 md:py-1 md:text-sm rounded-lg
      ${theme === "Dark"
                        ? "text-white border border-blue-800 hover:bg-blue-600"
                        : "bg-blue-600 text-white hover:bg-blue-400"
                      }`}
                    onClick={() => handleSort("Price")}
                  >
                    Price {sortConfig.key === "Price"
                      ? (sortConfig.direction === "asc" ? "▲" : "▼")
                      : ""}
                  </button>
                </div>

              </div>

              {filteredItems && (
                <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 gap-2 overflow-y-auto">
                  {sortedItems.map((item, index) => {
                    const outOfStock = item.Stock == 0;

                    return (


                      <button
                        key={index}
                        className={`p-3 md:p-5 shadow rounded-lg text-xs md:text-sm
    ${theme === "Dark"
                            ? "text-white bg-[#132962] hover:bg-blue-800"
                            : "bg-green-600 text-white hover:bg-green-400"
                          }
    ${outOfStock ? " cursor-not-allowed" : ""}
  `}
                        onClick={() => !outOfStock && addToCart(item)}

                      >
                        <p>{item.Name}</p>
                        <p>Ksh {item.Price} /=</p>

                        <p className="flex items-center justify-center gap-2 text-white">
                          Stock:

                          {outOfStock ? (
                            <span className="px-2 py-0.5 text-xs bg-red-600 rounded-full">
                              {item.Stock}
                            </span>
                          ) : (
                            <span className="">
                              {item.Stock}
                            </span>
                          )}
                        </p>

                      </button>

                    );
                  })}
                </div>
              )}

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


            </section>

            {/* Cart */}
            <section
              id="cart-section"
              className={`w-full md:w-1/3 p-4 border-t md:border-t-0 md:border-l rounded-lg
          ${theme === "Dark"
                  ? "text-white   "
                  : "bg-gray-300  "
                }`}
            >

              <div className="flex gap-2 mb-4">
                <button
                  className={`flex-1 py-2 px-3 text-xs sm:text-sm rounded font-medium
      ${theme === "Dark"
                      ? "text-white bg-green-800 hover:bg-green-600"
                      : "bg-green-600 text-white hover:bg-green-800 shadow"
                    }`}
                  onClick={() => setShowDeliveryModal(true)}
                >
                  Delivery Fee
                </button>

                <button
                  className={`flex-1 py-2 px-3 text-xs sm:text-sm rounded font-medium
      ${theme === "Dark"
                      ? "text-white bg-blue-800 hover:bg-blue-600"
                      : "bg-blue-600 text-white hover:bg-blue-800 shadow"
                    }`}
                  onClick={() => setShowCustomerPricesModal(true)}
                >
                  Customers
                </button>
              </div>


              <h3 className=" text-sm sm:text-lg font-bold mb-4">Cart</h3>
              <div className={`flex justify-between font-bold p-2 rounded mb-2  text-xs sm:text-sm 
            ${theme === "Dark"
                  ? "text-white bg-blue-800  "
                  : "bg-blue-600 shadow text-white "
                }`}
              >
                <div className="w-1/10 text-center">Unit</div>
                <div className="w-2/5 text-center">Name</div>
                <div className="w-1/5 text-left">Price</div>
                <div className="w-1/5 text-center">Total</div>
                <div className="w-1/5 text-center">Actions</div>
              </div>

              <div className="overflow-y-auto max-h-96">
                {cart.map((item, index) => (
                  <div
                    key={index}
                    className={` flex justify-between items-center p-2  rounded-md mb-2  text-xs sm:text-sm
                ${theme === "Dark"
                        ? "text-white "
                        : "bg-white shadow-md "
                      }`}
                  >
                    <div className="w-1/10 text-center">{item.stock}</div>
                    <div className="w-2/5 text-center">{item.Name}</div>
                    <div className="w-1/5 text-center">
                      <input
                        type="number"
                        value={item.Price}
                        className={`w-20 text-center rounded px-1
            ${theme === "Dark" ? "bg-gray-800 text-white" : "bg-white border"}
          `}
                        onChange={(e) =>
                          handlePriceChange(index, e.target.value)
                        }
                      />
                    </div>

                    {/* ✅ TOTAL PER ITEM */}
                    <div className="w-1/5 text-center font-bold ">
                      {(Number(item.Price || 0) * Number(item.stock || 0)).toLocaleString()}
                    </div>

                    <div className="w-3/10 flex justify-between">
                      <button
                        className={` py-0 px-3 text-lg  rounded   
                      ${theme === "Dark"
                            ? "text-white  bg-green-800  hover:bg-green-600   "
                            : "bg-green-600 text-white   hover:bg-green-800"
                          }`}
                        onClick={() => handleIncrease(item)}
                      >
                        +
                      </button>
                      <button
                        className={`  py-0 px-3 text-lg  mx-1 rounded
                         ${theme === "Dark"
                            ? "text-white  bg-blue-800  hover:bg-blue-600   "
                            : "bg-yellow-400 hover:bg-yellow-700 text-black "
                          }`}
                        onClick={() => handleDecrease(item)}
                      >
                        -
                      </button>
                      <button
                        className={` py-0 px-3 rounded 
                       ${theme === "Dark"
                            ? "text-white  bg-red-800  hover:bg-red-600 "
                            : "bg-red-600 text-white  hover:bg-red-800  "
                          }`}

                        onClick={() => handleRemove(item)}
                      >
                        X
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-4 font-bold   text-md sm:text-lg">
                Total: Ksh {total.toFixed(2)}
              </div>


              <div className="flex justify-around mt-4">
                <button
                  className={`py-2 px-3  text-xs sm:text-sm md:py-2 md:px-4 md:text-base mt-4 rounded
      ${theme === "Dark"
                      ? "text-white bg-blue-800 hover:bg-blue-600"
                      : "bg-blue-600 text-white hover:bg-blue-800 shadow-lg"
                    }`}
                  onClick={() => setReceiptModal(true)}
                >
                  Receipt
                </button>

                <button
                  className={`py-2 px-3  text-xs sm:text-sm md:py-2 md:px-4 md:text-base mt-4 rounded
      ${theme === "Dark"
                      ? "text-white bg-green-800 hover:bg-green-600"
                      : "bg-green-600 text-white hover:bg-green-800 shadow-lg"
                    }`}
                  onClick={() => setSendModal(true)}
                >
                  Sell
                </button>

                <button
                  className={`py-2 px-3  text-xs sm:text-sm md:py-2 md:px-4 md:text-base mt-4 rounded
      ${theme === "Dark"
                      ? "text-white bg-yellow-800 hover:bg-yellow-600"
                      : "bg-yellow-500 text-white hover:bg-yellow-800 shadow-lg"
                    }`}
                  onClick={() => setTicketModal(true)}
                >
                  Debt
                </button>

                <button
                  className={`py-2 px-3  text-xs sm:text-sm md:py-2 md:px-4 md:text-base mt-4 rounded
      ${theme === "Dark"
                      ? "text-white bg-red-800 hover:bg-red-600"
                      : "bg-red-600 text-white hover:bg-red-800 shadow-lg"
                    }`}
                  onClick={() => handleCancel()}
                >
                  Cancel
                </button>
              </div>
            </section>



          </div>
          {/* Mobile Go To Cart Button */}
          <button
            onClick={() =>
              document
                .getElementById("cart-section")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className={`fixed bottom-1 right-4 z-50 md:hidden
    flex items-center gap-2 px-3 py-3 rounded-full shadow-lg text-sm
    ${theme === "Dark"
                ? "bg-white text-black border-black border-1"
                : "bg-white text-black border-black border-1"}
  `}
          >
            🛒 Cart
            {cart.length > 0 && (
              <span className="bg-red-600 text-white text-xs px-2 py-0.5 rounded-full">
                {cart.length}
              </span>
            )}
          </button>

        </>
      )}

      {/* ================= DELIVERY FEE MODAL ================= */}
      {showDeliveryModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
          <div
            className={`p-6 rounded-xl shadow-lg w-80 sm:w-96 mx-4
        ${theme === "Dark" ? "bg-[#171941] text-white" : "bg-white text-black"}
      `}
          >
            <h2 className="text-md sm:text-lg font-bold mb-4 text-center">
              Delivery Fee (Ksh)
            </h2>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {deliveryFees.map((d, i) => (
                <div
                  key={i}
                  className={`flex justify-between items-center p-2.5 rounded-md text-sm
              ${theme === "Dark" ? "bg-[#20224f]" : "bg-gray-100"}
            `}
                >
                  <span className="font-medium">{d.distance}</span>
                  <span className="font-bold">Ksh {d.fee.toLocaleString()}</span>
                </div>
              ))}
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowDeliveryModal(false)}
                className={`px-5 py-2 rounded text-white font-medium text-xs sm:text-sm
            ${theme === "Dark"
                    ? "bg-red-800 hover:bg-red-600"
                    : "bg-red-600 hover:bg-red-800"
                  }
          `}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= CUSTOMER LAST PRICES MODAL ================= */}
      {showCustomerPricesModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 z-50">
          <div
            className={`p-6 rounded-xl shadow-lg w-[90%] sm:w-[520px] mx-4
        ${theme === "Dark" ? "bg-[#171941] text-white" : "bg-white text-black"}`}
          >
            <h2 className="text-md sm:text-lg font-bold mb-4 text-center">
              Customers' Last Prices
            </h2>

            <input
              placeholder="Search customer..."
              value={customerPriceSearch}
              onChange={(e) => setCustomerPriceSearch(e.target.value)}
              className={`w-full mb-3 rounded-lg py-2 px-3 text-sm outline-none border
          ${theme === "Dark" ? "bg-[#20224f] border-white/10 text-white" : "bg-white"}`}
            />

            <div className="overflow-y-auto max-h-80">
              {filteredCustomerPrices.length === 0 ? (
                <p className="text-center text-sm opacity-70 py-6">No purchase history found.</p>
              ) : (
                <table className="w-full text-left text-xs sm:text-sm">
                  <thead
                    className={`sticky top-0 ${theme === "Dark" ? "bg-blue-800 text-white" : "bg-blue-600 text-white"}`}
                  >
                    <tr>
                      <th className="p-2">Customer</th>
                      <th className="p-2">Item</th>
                      <th className="p-2 text-right">Last Price</th>
                      <th className="p-2 text-right">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredCustomerPrices.map((row, i) => (
                      <tr
                        key={i}
                        className={theme === "Dark" ? "border-b border-white/10" : "border-b"}
                      >
                        <td className="p-2 font-medium">{row.customerName}</td>
                        <td className="p-2">{row.item}</td>
                        <td className="p-2 text-right font-bold">
                          Ksh {row.lastPrice.toLocaleString()}
                        </td>
                        <td className="p-2 text-right opacity-80">{row.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <div className="flex justify-center mt-6">
              <button
                onClick={() => setShowCustomerPricesModal(false)}
                className={`px-5 py-2 rounded text-white font-medium text-xs sm:text-sm
            ${theme === "Dark" ? "bg-red-800 hover:bg-red-600" : "bg-red-600 hover:bg-red-800"}`}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* ticket Modal */}
      {ticketModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
          <div
            className={`p-6 rounded-xl shadow w-96 mx-4 ${theme === "Dark" ? "bg-[#171941]" : "bg-white"
              }`}
          >
            <h2 className="text-md sm:text-lg font-bold mb-4 text-center">
              Debt Details
            </h2>

            <div className="mt-4 font-bold text-md sm:text-lg">
              Total: Ksh {total.toFixed(2)}
            </div>

            {/* CUSTOMER NAME (TYPE OR SELECT) */}
            {/* CUSTOMER */}
            <div className="mt-4">
              <label className="text-xs sm:text-sm font-medium text-gray-600">
                Customer
              </label>

              <select
                className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#303133] shadow-md text-black text-xs sm:text-base"
                value={customerSelect}
                onChange={(e) => {
                  setCustomerSelect(e.target.value);
                }}
              >
                <option value="" disabled>--Select Customer--</option>

                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.Name} {customer.Phone ? `- ${customer.Phone}` : ""}
                  </option>
                ))}
              </select>


            </div>

            <div className="mt-4 font-bold text-sm sm:text-lg">
              Sold by {userAccountName}
            </div>

            <div className="flex flex-row justify-evenly mt-4">
              <button
                className={`text-white px-4 py-2 rounded text-xs sm:text-base ${theme === "Dark"
                  ? "bg-green-800 hover:bg-green-600"
                  : "bg-green-600 hover:bg-green-800"
                  }`}
                onClick={handleticket}
              >
                Approve Debt
              </button>

              <button
                className={`text-white px-4 py-2 rounded text-xs sm:text-base ${theme === "Dark"
                  ? "bg-red-800 hover:bg-red-600"
                  : "bg-red-600 hover:bg-red-800"
                  }`}
                onClick={ticketModalFun}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}


      {/* receipt details Modal */}
      {receiptDetailsModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
          <div
            className={`p-6 rounded-xl shadow w-96 ${theme === "Dark" ? "bg-[#171941]" : "bg-white"
              }`}
          >
            <h2 className="text-lg font-bold mb-4 text-center">
              Enter Receipt details
            </h2>

            <div className="mt-4 font-bold text-lg">
              Total: Ksh {total.toFixed(2)}
            </div>

            <div className="mt-4">
              <div className="mt-4  font-bold text-lg">
                Sold by {userAccountName}
              </div>

            </div>

            <div className="flex flex-row justify-evenly">
              <button
                className={`text-white px-4 py-2 rounded mt-4 ${theme === "Dark"
                  ? "bg-green-800 hover:bg-green-600"
                  : "bg-green-600 hover:bg-green-800"
                  }`}
                onClick={receiptDetailsClose}
              >
                View Receipt
              </button>
              <button
                className={`text-white px-4 py-2 rounded mt-4 ${theme === "Dark"
                  ? "bg-red-800 hover:bg-red-600"
                  : "bg-red-600 hover:bg-red-800"
                  }`}
                onClick={receiptDetailsModalFun}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Add this near your other receipt-related state, if it doesn't exist yet.
    Set it to false whenever a sale goes through Debt/unpaid flow, true for normal Sell. */}
      {/* const [isPaid, setIsPaid] = useState(true); */}

      {receiptModal && (
        <div className="w-full flex items-center justify-center bg-black bg-opacity-10 overflow-y-auto">

          <div
            className={`p-4  shadow w-[380px] font-sans text-sm  print-area receipt-container
  ${theme === "Dark" ? "bg-white text-black" : "bg-white text-black"}
`}
          >
            <div className="text-center text-2xl font-bold">
              <p className="text-xl font-extrabold tracking-tight uppercase font-sans">
                {bizName}
              </p>
              <p className="font-semibold text-xs">Email : {bizEmail}</p>
              <p className="font-semibold text-xs">TEL :{bizPhone}</p>
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

            {/* ✅ NOT PAID INDICATOR */}

            <div className="text-center my-2">
              <span className="inline-block border-2 border-red-600 text-red-600 font-extrabold text-sm sm:text-base uppercase tracking-widest px-4 py-1 rotate-[-3deg]">
                NOT PAID
              </span>
            </div>


            <div className="flex justify-between mb-2 font-bold">
              <div>
                {/**<p className="text-sm  ">Till No: {selectedTill}</p> */}
                <p className="text-sm ">M/S: {userAccountName}</p>
                <p className="text-sm ">PIN:</p>
              </div>
              <div>
                <p className="text-sm">Cash Sale #: {receiptNumber}</p>
              </div>

            </div>
            <div className="border-t border-dotted border-black/20"></div>

            <div className="flex justify-between mb-1">
              <p className="text-sm">Date: {selectedDate}</p>
              <p className="text-sm ">Time:<span className="text-xs mx-3"> {selectedTime}</span></p>
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
              <div className="flex justify-between font-bold text-lg">
                <span>TOTAL:</span>
                <span>{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
              </div>
              <div className="border-t border-dotted border-black/20"></div>
              <div className="flex justify-between font-bold text-lg">
                <span>CASH:</span>
                <span>{total.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
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
                <span className="text-center w-40 mr-7">{totalItems}</span>
              </p>
              <div className="border-t border-dotted border-black/20"></div>
              <p className="flex items-center font-bold">
                <strong className="flex-1">TOTAL QTY:</strong>
                <span className="text-center w-40 mr-7">{totalQty}</span>
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
              <p className="font-bold">YOU WERE SERVED BY : {userAccountName}</p>
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
      {/* send Modal */}
      {sendModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80">
          <div
            className={`p-6 rounded-xl shadow w-96 mx-4 max-h-[90vh] overflow-y-auto ${theme === "Dark" ? "bg-[#171941]" : "bg-white"
              }`}
          >
            <h2 className="text-md sm:text-lg font-bold mb-4 text-center">
              Confirm Sell
            </h2>

            {/* =========================================================
        CALCULATIONS
    ========================================================= */}
            {(() => {
              const subtotal = Number(total) || 0;
              const delivery = Number(deliveryFee) || 0;
              const grandTotal = subtotal + delivery;

              // Full payment always equals the grand total — no manual entry needed
              const singlePaid =
                paymentType === "Full" ? grandTotal : Number(amountPaid) || 0;

              const splitPaid = multiPayments.reduce(
                (sum, payment) => sum + (Number(payment.amount) || 0),
                0
              );

              /*
               * For BOTH Full and Partial:
               * - Single = amountPaid (or grandTotal if Full)
               * - Split  = sum of multiPayments
               */
              const paidNow =
                paymentMode === "Split" ? splitPaid : singlePaid;

              const balance = Math.max(grandTotal - paidNow, 0);
              const change = Math.max(paidNow - grandTotal, 0);

              return (
                <>
                  {/* CUSTOMER */}
                  <div className="mt-4">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">
                      Customer (Optional)
                    </label>

                    <select
                      className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#303133] shadow-md text-black text-xs sm:text-base"
                      value={customerSelect}
                      onChange={(e) => setCustomerSelect(e.target.value)}
                    >
                      <option value="" disabled>
                        --Select Customer--
                      </option>

                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.Name}{" "}
                          {customer.Phone ? `- ${customer.Phone}` : ""}
                        </option>
                      ))}
                    </select>
                  </div>



                  {/* =====================================================
              STEP 1: PAYMENT TYPE
          ===================================================== */}
                  <div className="mt-4">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">
                      Payment Type
                    </label>

                    <div className="flex gap-2 mt-2">
                      {/* FULL */}
                      <button
                        type="button"
                        className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${paymentType === "Full"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700"
                          }`}
                        onClick={() => {
                          setPaymentType("Full");
                          setPaymentMode("Single");
                          setAmountPaid("");
                          setPaymentError("");
                          setMultiPayments([
                            {
                              method: "cash",
                              amount: "",
                            },
                          ]);
                        }}
                      >
                        Full Payment
                      </button>

                      {/* PARTIAL */}
                      <button
                        type="button"
                        className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${paymentType === "Partial"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700"
                          }`}
                        onClick={() => {
                          setPaymentType("Partial");
                          setPaymentMode("Single");
                          setAmountPaid("");
                          setPaymentError("");
                          setMultiPayments([
                            {
                              method: "cash",
                              amount: "",
                            },
                          ]);
                        }}
                      >
                        Partial (Credit)
                      </button>
                    </div>

                    {/* ===================================================
                PARTIAL PAYMENT CUSTOMER WARNING
            =================================================== */}
                    {paymentType === "Partial" && !customerSelect && (
                      <p className="text-red-500 text-xs mt-3 font-medium">
                        Select a customer above to record credit.
                      </p>
                    )}
                  </div>

                  {/* =====================================================
              STEP 2: HOW IT'S BEING PAID
          ===================================================== */}
                  <div className="mt-4">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">
                      {paymentType === "Full"
                        ? "Pay Full Amount Via"
                        : "Pay Partial Amount Via"}
                    </label>

                    {/* ===================================================
                SINGLE / SPLIT
                AVAILABLE FOR BOTH FULL AND PARTIAL
            =================================================== */}
                    <div className="flex gap-2 mt-2">
                      {/* ONE METHOD */}
                      <button
                        type="button"
                        className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${paymentMode === "Single"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700"
                          }`}
                        onClick={() => {
                          setPaymentMode("Single");
                          setAmountPaid("");
                          setPaymentError("");
                          setMultiPayments([
                            {
                              method: "cash",
                              amount: "",
                            },
                          ]);
                        }}
                      >
                        One Method
                      </button>

                      {/* SPLIT METHODS */}
                      <button
                        type="button"
                        className={`flex-1 py-2 rounded-lg text-xs sm:text-sm font-semibold transition ${paymentMode === "Split"
                          ? "bg-blue-600 text-white"
                          : "bg-gray-200 text-gray-700"
                          }`}
                        onClick={() => {
                          setPaymentMode("Split");
                          setAmountPaid("");
                          setPaymentError("");
                          setMultiPayments([
                            {
                              method: "cash",
                              amount: "",
                            },
                          ]);
                        }}
                      >
                        Split Methods
                      </button>
                    </div>

                    {/* ===================================================
                ONE METHOD PAYMENT
                WORKS FOR BOTH FULL + PARTIAL
            =================================================== */}
                    {paymentMode === "Single" && (
                      <div className="mt-3">

                        {/* PAYMENT METHOD */}
                        <select
                          className={`w-full p-3 border rounded focus:outline-none focus:ring-2 shadow-md text-black text-xs sm:text-base ${paymentError
                            ? "border-red-500 ring-red-300"
                            : "border-gray-300 focus:ring-[#303133]"
                            }`}
                          value={paymentMethod}
                          onChange={(e) => {
                            setPaymentMethod(e.target.value);
                            setPaymentError("");
                          }}
                        >
                          <option value="" disabled>
                            -- Select Payment Method --
                          </option>
                          <option value="cash">Cash</option>
                          <option value="till">Till Number</option>
                          <option value="paybill">Paybill</option>
                          <option value="bank">Bank</option>
                        </select>

                        {/* AMOUNT — only needed for Partial. Full always pays the grand total. */}
                        {paymentType === "Partial" ? (
                          <div className="mb-3">
                            <label className="text-xs sm:text-sm font-medium text-gray-600">
                              Amount Paying Now
                            </label>

                            <input
                              type="number"
                              min="0"
                              placeholder="Enter amount paying now (leave blank if fully on credit)"
                              className={`w-full p-3 border rounded focus:outline-none focus:ring-2 shadow-md text-black text-xs sm:text-base ${paymentError
                                ? "border-red-500 ring-red-300"
                                : "border-gray-300 focus:ring-[#303133]"
                                }`}
                              value={amountPaid}
                              onChange={(e) => {
                                setAmountPaid(e.target.value);
                                setPaymentError("");
                              }}
                            />
                          </div>
                        ) : (
                          <p className="mt-3 mb-3 text-xs sm:text-sm text-gray-600">
                            Amount to pay: <span className="font-semibold">Ksh {grandTotal.toFixed(2)}</span>
                          </p>
                        )}
                      </div>
                    )}

                    {/* ===================================================
                SPLIT PAYMENTS
                WORKS FOR BOTH FULL + PARTIAL
            =================================================== */}
                    {paymentMode === "Split" && (
                      <div className="mt-3 border border-gray-300 rounded p-3">

                        {multiPayments.map((entry, index) => (
                          <div
                            key={index}
                            className="flex gap-2 mt-2 items-center first:mt-0"
                          >
                            {/* PAYMENT METHOD */}
                            <select
                              className="flex-1 p-2 border border-gray-300 rounded text-black text-xs sm:text-sm"
                              value={entry.method}
                              onChange={(e) => {
                                const updated = [...multiPayments];

                                updated[index].method = e.target.value;

                                setMultiPayments(updated);
                                setPaymentError("");
                              }}
                            >
                              <option value="cash">Cash</option>
                              <option value="till">Till</option>
                              <option value="paybill">Paybill</option>
                              <option value="bank">Bank</option>
                            </select>

                            {/* AMOUNT */}
                            <input
                              type="number"
                              min="0"
                              placeholder="Amount"
                              className="w-24 p-2 border border-gray-300 rounded text-black text-xs sm:text-sm"
                              value={entry.amount}
                              onChange={(e) => {
                                const updated = [...multiPayments];

                                updated[index].amount = e.target.value;

                                setMultiPayments(updated);
                                setPaymentError("");
                              }}
                            />

                            {/* REMOVE */}
                            {multiPayments.length > 1 && (
                              <button
                                type="button"
                                className="text-red-500 text-xs font-bold px-2"
                                onClick={() =>
                                  setMultiPayments(
                                    multiPayments.filter(
                                      (_, i) => i !== index
                                    )
                                  )
                                }
                              >
                                ✕
                              </button>
                            )}
                          </div>
                        ))}

                        {/* ADD PAYMENT METHOD */}
                        <button
                          type="button"
                          className="text-xs sm:text-sm font-medium text-blue-600 mt-3"
                          onClick={() =>
                            setMultiPayments([
                              ...multiPayments,
                              {
                                method: "cash",
                                amount: "",
                              },
                            ])
                          }
                        >
                          + Add Payment Mode
                        </button>

                      </div>
                    )}

                    {/* ===================================================
                VALIDATION ERROR — shown for BOTH Single and Split
            =================================================== */}
                    {paymentError && (
                      <p className="text-red-500 text-xs mt-3 font-medium">
                        {paymentError}
                      </p>
                    )}
                  </div>




                  {/* DELIVERY FEE */}
                  <div className="mt-4">
                    <label className="text-xs sm:text-sm font-medium text-gray-600">
                      Delivery Fee (Optional)
                    </label>

                    <input
                      type="number"
                      min="0"
                      className="w-full p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#303133] shadow-md text-black text-xs sm:text-base"
                      value={deliveryFee}
                      onChange={(e) =>
                        setDeliveryFee(Number(e.target.value) || 0)
                      }
                      placeholder="0.00"
                    />
                  </div>



                  {/* =====================================================
SOLD BY / CASHIER
===================================================== */}
                  <div
                    className={`mt-4 p-3 rounded-xl border flex items-center gap-3 ${theme === "Dark"
                      ? "bg-[#20234f] border-blue-500/30"
                      : "bg-blue-50 border-blue-200"
                      }`}
                  >
                    {/* USER ICON */}
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${theme === "Dark"
                        ? "bg-blue-600 text-white"
                        : "bg-blue-600 text-white"
                        }`}
                    >
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="w-5 h-5"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M4 21a8 8 0 0116 0"
                        />
                      </svg>
                    </div>

                    {/* USER DETAILS */}
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-[10px] sm:text-xs uppercase tracking-wider font-semibold ${theme === "Dark" ? "text-blue-300" : "text-blue-600"
                          }`}
                      >
                        Sold By
                      </p>

                      <p
                        className={`text-sm sm:text-base font-bold truncate ${theme === "Dark" ? "text-white" : "text-gray-800"
                          }`}
                      >
                        {userAccountName || "Unknown User"}
                      </p>
                    </div>

                    {/* SELLER BADGE */}
                    <div
                      className={`text-[10px] sm:text-xs font-semibold px-2.5 py-1 rounded-full ${theme === "Dark"
                        ? "bg-green-500/15 text-green-400"
                        : "bg-green-100 text-green-700"
                        }`}
                    >
                      Cashier
                    </div>
                  </div>



                  {/* =====================================================
              TOTALS / PAYMENT SUMMARY
          ===================================================== */}
                  <div className="mt-4 p-3 rounded bg-gray-100 text-black">
                    <div className="flex justify-between text-xs sm:text-sm">
                      <span>Subtotal</span>
                      <span>Ksh {subtotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-xs sm:text-sm">
                      <span>Delivery</span>
                      <span>Ksh {delivery.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between font-bold text-sm sm:text-base border-t border-gray-300 mt-1 pt-1">
                      <span>Grand Total</span>
                      <span>Ksh {grandTotal.toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-xs sm:text-sm mt-2">
                      <span>Paid Now</span>
                      <span>Ksh {paidNow.toFixed(2)}</span>
                    </div>

                    {/* BALANCE */}
                    {balance > 0 && (
                      <div className="flex justify-between font-bold text-xs sm:text-sm mt-1 text-orange-600">
                        <span>Client Balance</span>
                        <span>Ksh {balance.toFixed(2)}</span>
                      </div>
                    )}

                    {/* CHANGE */}
                    {change > 0 && (
                      <div className="flex justify-between font-bold text-xs sm:text-sm mt-1 text-green-600">
                        <span>Change</span>
                        <span>Ksh {change.toFixed(2)}</span>
                      </div>
                    )}

                    {/* FULLY PAID */}
                    {paidNow === grandTotal && grandTotal > 0 && (
                      <div className="flex justify-between font-bold text-xs sm:text-sm mt-1 text-green-600">
                        <span>Status</span>
                        <span>Fully Paid</span>
                      </div>
                    )}
                  </div>


                  {/* BUTTONS */}
                  <div className="flex flex-row justify-evenly mt-6">
                    <button
                      className={`text-white px-4 py-2 rounded text-xs sm:text-base ${theme === "Dark"
                        ? "bg-green-800 hover:bg-green-600"
                        : "bg-green-600 hover:bg-green-800"
                        }`}
                      onClick={() => {
                        if (paymentType === "Partial") {
                          handleticket();
                        } else {
                          handleConfirmSell();
                        }
                      }}
                    >
                      Sell
                    </button>

                    <button
                      className={`text-white px-4 py-2 rounded text-xs sm:text-base ${theme === "Dark"
                        ? "bg-red-800 hover:bg-red-600"
                        : "bg-red-600 hover:bg-red-800"
                        }`}
                      onClick={sendModalFun}
                    >
                      Cancel
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}

      {sendMpesa && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-0">
          <div className={` p-6 rounded-xl shadow w-96  mx-4
                        ${theme === "Dark"
              ? " bg-[#171941] "
              : " bg-white "
            }`
          }>
            <h2 className=" text-md sm:text-lg font-bold mb-4 text-center">Confirm Sell </h2>

            <div className="mt-4 font-bold  text-md sm:text-lg">
              Total: Ksh {total.toFixed(2)}
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 rounded-xl ">
                Enter Phone Number
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="mt-1 w-full px-3 py-2 border rounded-md  text-sm sm:text-base"
                placeholder=""
              />
            </div>


            <div className=" flex flex-row justify-evenly">
              <button
                className={` text-white px-4 py-2 rounded  mt-4   text-xs sm:text-base
                                
                              ${theme === "Dark"
                    ? "bg-green-800  hover:bg-green-600"
                    : "bg-green-600  hover:bg-green-800 "
                  }`}
                onClick={handleSubmit}
              >
                Sell
              </button>
              <button
                className={` text-white px-4 py-2 rounded mt-4  text-xs sm:text-base
                                  ${theme === "Dark"
                    ? "bg-red-800  hover:bg-red-600"
                    : "bg-red-600  hover:bg-red-800 "
                  }`}
                onClick={sendMpesaFun}
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
            <p>The Items were sold</p>
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
            <p>The items were not sold</p>
          </div>
        </div>
      )}

      {sendModalFailTotal && (
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
            <p>The Cart is Empty</p>
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

      {/* Auto-Close Modals */}
      {ticketModalSuccess && (
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
            <p>Debt / Partial Payment Approved</p>
          </div>
        </div>
      )}

      {ticketModalFail && (
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
            <p>Debt / Partial Payment Not Approved</p>
          </div>
        </div>
      )}

      {ticketModalFailTotal && (
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
            <p>The cart is Empty</p>
          </div>
        </div>
      )}

      {ticketModalFailEmployee && (
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

      {itemMaxFail && (
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
            <p>The Maximum Stock of Item </p>
          </div>
        </div>
      )}

      {ItemOutStockFail && (
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
            <p>Item is Out of Stock </p>
          </div>
        </div>
      )}

    </div>

  )


}

export default Dashboard

