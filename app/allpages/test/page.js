import React from "react";

const Receipt = () => {

    const receiptData = {
        title: "DASHANNA WHOLESALERS",
        address: "P.O.BOX 24 / AMARAGO 11-KINYA.",
        tel: "TEL: 0723-679389",
        vat: "VAT # : A0026911811",
        pin: "PIN # : A0026911811",
        paybill: "PAYBILL: 157424",
        tillNo: "4",
        ms: "ASKAH",
        date: "01/04/2025",
        time: "09:21:35",
        items: [
          { name: "DETREX SOAP 7", code: "0000", qty: "3.00", unit: "CTH", price: "1,800.00", amount: "5,400.00", vatCode: "A" },
          { name: "SAWA CLYGERINE PUER 30ML", code: "0666", qty: "3.00", unit: "DZN", price: "280.00", amount: "840.00", vatCode: "A" },
          { name: "SAWA CLYGERINE PUER 50ML", code: "6697", qty: "5.00", unit: "DZN", price: "420.00", amount: "2,100.00", vatCode: "A" },
          { name: "DETREX SOAP 24X175GM", code: "KJSP", qty: "1.00", unit: "CTH", price: "1,800.00", amount: "1,800.00", vatCode: "A" },
          { name: "SAWA DETROCEUM JELLY 50ML", code: "SQP2", qty: "1.00", unit: "DZN", price: "700.00", amount: "700.00", vatCode: "A" },
          { name: "SAWA MIFRING JELLY 50ML", code: "716", qty: "2.00", unit: "DZN", price: "1,150.00", amount: "2,300.00", vatCode: "A" },
          { name: "SAWA MIFRING JELLY 50CM", code: "VOP2", qty: "3.00", unit: "DZN", price: "1,050.00", amount: "3,150.00", vatCode: "A" },
          { name: "USHINDHEAR SOAP", code: "100", qty: "1.00", unit: "-", price: "0.00", amount: "0.00", vatCode: "-" },
        ],
        total: "32,430.00",
        cash: "0.00",
        change: "0.00",
        totalItems: "8",
        totalQty: "19.00",
        vatableAmt: "27,956.67",
        exemptAmt: "0.00",
        zeroRatedAmt: "0.00",
        cashSaleNo: "MRC6844162",
        cusn: "KRAIM0011202206038102",
        cuInv: "011039102000135813",
      };


  return (
<>
<div className="font-mono text-sm w-[380px] bg-white text-black p-4 border border-gray-300">
      {/* Header Section */}
      <div className="text-center font-bold">
        <p>DASHAMA WHOLESALERS</p>
        <p className="font-normal text-xs">P.O.BOX: 2, MARAGOLI-KENYA.</p>
        <p className="font-normal text-xs">TEL: 0721-053989</p>
        <p className="font-normal text-xs">VAT : A002691181T | PIN : A002691181T</p>
      </div>

      {/* Paybill Section with background */}
      <div className="bg-black text-white text-center py-1 my-2 font-bold">
        PAYBILL: 157424
      </div>

      {/* Cash Sale Header */}
      <div className="text-center font-bold mb-2">CASH SALE</div>

      {/* Transaction Details */}
      <div className="text-xs">
        <p>Till No: 4</p>
        <p>Cash Sale #: MRCS844162</p>
        <p>M/S: ASKA H</p>
        <p>Date: 01/04/2025</p>
        <p>Time: 09:27:16</p>
      </div>

      <hr className="my-2" />

      {/* Footer Summary */}
      <div className="text-xs space-y-1">
        <p><strong>TOTAL:</strong> 32,430.00</p>
        <p><strong>CASH:</strong> 32,430.00</p>
        <p><strong>CHANGE:</strong> 0.00</p>
        <p><strong>TOTAL ITEMS:</strong> 11</p>
        <p><strong>TOTAL QTY:</strong> 40</p>
      

        {/* VAT Breakdown */}
        <div className="mt-2">
          <p><strong>CODE&nbsp;&nbsp;&nbsp;&nbsp;VATABLE AMT&nbsp;&nbsp;&nbsp;&nbsp;VAT AMT&nbsp;&nbsp;&nbsp;&nbsp;TOTAL</strong></p>
          <p>A&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;27,956.87&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;4,473.13&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;32,430.00</p>
          <p>E&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.00&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.00</p>
          <p>Z&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.00&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;0.00</p>
        </div>

        <p className="mt-2">VAT CODE = (A)=VATABLE, (E)=EXEMPT, (Z)=ZERO RATED</p>
        <p>PRICES INCLUSIVE OF VAT WHERE APPLICABLE</p>

        <p>YOU WERE SERVED BY : TILL 04</p>
        <p className="text-center font-bold mt-2">GOODS ONCE SOLD CANNOT BE ACCEPTED BACK FOR REFUND OR ANY OTHER REASON</p>

        {/* QR Code Placeholder */}
        <div className="flex justify-center my-3">
          <div className="w-24 h-24 border border-gray-400 flex items-center justify-center text-[10px]">
            QR CODE
          </div>
        </div>

        <p>CUSN: KRAMW011202260839102</p>
        <p>CU INV: 011039102001/25</p>
        <p className="text-center font-bold">Thank You. Call Again.</p>
      </div>
    </div>

    <div className="bg-black text-white p-6 max-w-md mx-auto font-mono">
      {/* Header */}
      <h1 className="text-xl font-bold text-center mb-2">{receiptData.title}</h1>
      <p className="text-center text-sm">{receiptData.address}</p>
      <p className="text-center text-sm">{receiptData.tel}</p>
      <div className="flex justify-center gap-x-4">
        <p className="text-sm">{receiptData.vat}</p>
        <p className="text-sm">{receiptData.pin}</p>
      </div>
      <p className="text-center text-sm mb-4">{receiptData.paybill}</p>

      {/* Cash Sale Title */}
      <h2 className="text-lg font-bold text-center mb-2">CASH SALE</h2>
      
      {/* Till No, M/S, Date, Time */}
      <div className="flex justify-between mb-2">
        <p className="text-sm">Till No.: {receiptData.tillNo}</p>
        <p className="text-sm">M/S: {receiptData.ms}</p>
      </div>
      <div className="flex justify-between mb-4">
        <p className="text-sm">Date: {receiptData.date}</p>
        <p className="text-sm">Time: {receiptData.time}</p>
      </div>

      {/* Items Table */}
      <div className="mb-4">
        <p className="font-bold text-sm mb-1">ITEM:</p>
        <hr className="border-gray-500 mb-1" />
        {receiptData.items.map((item, index) => (
          <div key={index} className="flex justify-between mb-1 text-sm">
            <span className="w-40 truncate">{item.name}</span>
            <span className="w-12">{item.code}</span>
            <span className="w-12 text-right">{item.qty}</span>
            <span className="w-12">({item.unit})</span>
            <span className="w-16 text-right">{item.price}</span>
            <span className="w-16 text-right">{item.amount}</span>
            <span className="w-8 text-right">{item.vatCode}</span>
          </div>
        ))}
        <hr className="border-gray-500 mt-1" />
      </div>

      {/* Totals */}
      <div className="mb-2">
        <div className="flex justify-between">
          <p className="font-bold text-sm">TOTAL:</p>
          <p className="text-sm">{receiptData.total}</p>
        </div>
        <div className="flex justify-between">
          <p className="font-bold text-sm">CASH:</p>
          <p className="text-sm">{receiptData.cash}</p>
        </div>
        <div className="flex justify-between">
          <p className="font-bold text-sm">CHANGE:</p>
          <p className="text-sm">{receiptData.change}</p>
        </div>
        <div className="flex justify-between">
          <p className="font-bold text-sm">TOTAL ITEMS:</p>
          <p className="text-sm">{receiptData.totalItems}</p>
        </div>
        <div className="flex justify-between">
          <p className="font-bold text-sm">TOTAL QTY:</p>
          <p className="text-sm">{receiptData.totalQty}</p>
        </div>
      </div>

      {/* VAT Summary */}
      <div className="mb-2">
        <p className="font-bold text-sm">VAT SUMMARY:</p>
        <div className="flex justify-between">
          <p className="text-sm">VATABLE (A):</p>
          <p className="text-sm">{receiptData.vatableAmt}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-sm">EXEMPT (E):</p>
          <p className="text-sm">{receiptData.exemptAmt}</p>
        </div>
        <div className="flex justify-between">
          <p className="text-sm">ZERO RATED (Z):</p>
          <p className="text-sm">{receiptData.zeroRatedAmt}</p>
        </div>
      </div>

      {/* Footer Notes */}
      <div className="mb-2 text-xs">
        <p>VAT CODE: (A) VATABLE, (B) EXEMPT, (C) ZERO RATED</p>
        <p>PRICES INCLUSIVE OF VAT WHERE APPLICABLE</p>
        <p className="mt-2">GOODS ONCE SOLD CANNOT BE ACCEPTED BACK FOR REFUND OR ANY OTHER REASON.</p>
      </div>

      {/* Cash Sale No, QR, etc. */}
      <div className="mb-2">
        <p className="text-sm">Cash Sale #: {receiptData.cashSaleNo}</p>
        <p className="text-sm">Served by: </p>
        {/* QR Placeholder */}
        <div className="bg-white h-24 w-24 mx-auto my-2 flex items-center justify-center">
          <p className="text-black">QR CODE</p>
        </div>
        <p className="text-sm">CUSN: {receiptData.cusn}</p>
        <p className="text-sm">CU INV: {receiptData.cuInv}</p>
      </div>

      {/* Thank You */}
      <p className="text-center font-bold mt-2">Thank You</p>
      <p className="text-center">Come Again</p>
    </div>


</>

   
  );
};

export default Receipt;