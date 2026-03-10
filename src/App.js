import React, { useState, useEffect } from "react";
import {
  Home,
  Briefcase,
  ArrowRightLeft,
  User,
  MapPin,
  ShieldCheck,
  TrendingUp,
  ChevronLeft,
  Building,
  CheckCircle2,
  AlertCircle,
  IndianRupee,
  PieChart,
  ArrowUpRight,
  Info,
} from "lucide-react";
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  signInWithCustomToken,
  onAuthStateChanged,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  doc,
  updateDoc,
  addDoc,
  onSnapshot,
  getDocs,
} from "firebase/firestore";

// --- Configuration & Initialization ---
const appId = typeof __app_id !== "undefined" ? __app_id : "fractional-re-app";

// Default Seed Data for the Indian Market
const defaultProperties = [
  {
    name: "Nagpur Logistics Hub",
    location: "MIHAN SEZ, Nagpur, MH",
    total_value: 100000000, // 10 Cr
    current_funding: 65000000, // 6.5 Cr
    rental_yield: 10.5,
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8ed7c508f0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    min_investment: 10000,
    type: "Logistics Warehouse",
    description:
      "A Grade-A logistics and warehousing facility spanning 100,000 sq ft, pre-leased to top-tier e-commerce giants. Situated strategically in Central India with a 9-year lock-in.",
    rera: "P50500023456",
  },
  {
    name: "Cyber Park Commercial",
    location: "Hinjewadi, Pune, MH",
    total_value: 250000000, // 25 Cr
    current_funding: 200000000, // 20 Cr
    rental_yield: 8.8,
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    min_investment: 25000,
    type: "Commercial Office",
    description:
      "Premium IT/ITeS office space located in Phase 1. Fully furnished and occupied by a Fortune 500 tech company providing stable, long-term rental income.",
    rera: "P52100011223",
  },
  {
    name: "Bandra Retail Plaza",
    location: "Bandra West, Mumbai, MH",
    total_value: 80000000, // 8 Cr
    current_funding: 20000000, // 2 Cr
    rental_yield: 7.2,
    image:
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    min_investment: 50000,
    type: "High-Street Retail",
    description:
      "High-street retail shop leased to a premium international coffee chain. Situated in a high-footfall luxury corridor with exceptional capital appreciation potential.",
    rera: "P51800099887",
  },
];

const mockP2PListings = [
  {
    id: "p2p1",
    propertyName: "Nagpur Logistics Hub",
    seller: "Aarav M.",
    fraction_percentage: 0.15,
    asking_price: 15500,
    yield: 10.5,
  },
  {
    id: "p2p2",
    propertyName: "Cyber Park Commercial",
    seller: "Neha S.",
    fraction_percentage: 0.05,
    asking_price: 13000,
    yield: 8.8,
  },
  {
    id: "p2p3",
    propertyName: "Bandra Retail Plaza",
    seller: "Vikram R.",
    fraction_percentage: 0.2,
    asking_price: 165000,
    yield: 7.2,
  },
];

// --- Utility Functions ---
const formatINR = (amount) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
};

// --- Components ---

// 1. Progress Components
const LinearProgress = ({ current, total }) => {
  const percentage = Math.min(100, (current / total) * 100);
  return (
    <div className="w-full bg-slate-100 rounded-full h-2.5 mt-3 mb-1 overflow-hidden">
      <div
        className="bg-emerald-500 h-2.5 rounded-full transition-all duration-1000"
        style={{ width: `${percentage}%` }}
      ></div>
    </div>
  );
};

const CircularProgress = ({ current, total }) => {
  const percentage = Math.min(100, (current / total) * 100);
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg className="w-24 h-24 transform -rotate-90 drop-shadow-sm">
        <circle
          cx="48"
          cy="48"
          r="36"
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          className="text-slate-100"
        />
        <circle
          cx="48"
          cy="48"
          r="36"
          stroke="currentColor"
          strokeWidth="6"
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="text-emerald-500 transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-lg font-bold text-slate-900">
          {percentage.toFixed(0)}%
        </span>
        <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-widest">
          Funded
        </span>
      </div>
    </div>
  );
};

// 2. Investment Calculator
const InvestmentCalculator = ({ property }) => {
  const [amount, setAmount] = useState(property.min_investment);
  const monthlyYield = (amount * (property.rental_yield / 100)) / 12;
  const yearlyYield = amount * (property.rental_yield / 100);
  const capitalAppreciation = amount * Math.pow(1.06, 5) - amount; // 6% assumed capital appreciation
  const totalValue5Yrs = amount + yearlyYield * 5 + capitalAppreciation;

  return (
    <div className="bg-white border border-slate-200 shadow-sm p-5 rounded-2xl mt-6">
      <h3 className="font-bold text-slate-900 mb-5 flex items-center gap-2">
        <PieChart size={18} className="text-emerald-500" /> Investment
        Calculator
      </h3>
      <div className="mb-6">
        <label className="text-sm text-slate-500 flex justify-between mb-2">
          <span>Investment Amount</span>
          <span className="font-bold text-slate-900 text-lg">
            {formatINR(amount)}
          </span>
        </label>
        <input
          type="range"
          min={property.min_investment}
          max={1000000}
          step={10000}
          value={amount}
          onChange={(e) => setAmount(Number(e.target.value))}
          className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-emerald-500"
        />
        <div className="flex justify-between mt-2 text-xs text-slate-400 font-medium">
          <span>{formatINR(property.min_investment)} (Min)</span>
          <span>{formatINR(1000000)}</span>
        </div>
      </div>
      <div className="space-y-3 pt-4 border-t border-slate-100">
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500">Est. Monthly Payout</span>
          <span className="font-bold text-slate-900">
            {formatINR(monthlyYield)}
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-sm text-slate-500">Total Value in 5 Yrs</span>
          <span className="font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md">
            {formatINR(totalValue5Yrs)}
          </span>
        </div>
      </div>
    </div>
  );
};

// --- Main Application Component ---
export default function App() {
  const [activeTab, setActiveTab] = useState("home");
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [showInvestModal, setShowInvestModal] = useState(false);

  // App State
  const [user, setUser] = useState(null);
  const [properties, setProperties] = useState([]);
  const [investments, setInvestments] = useState([]);
  const [kycStatus, setKycStatus] = useState(0); // 0: None, 3: Completed
  const [loading, setLoading] = useState(true);
  const [globalDb, setGlobalDb] = useState(null);

  // Firebase Initialization & Sync
  useEffect(() => {
    let unsubscribeAuth;
    const initFirebase = async () => {
      try {
        const configStr =
          typeof __firebase_config !== "undefined" ? __firebase_config : null;
        if (!configStr) throw new Error("No config");

        const app = initializeApp(JSON.parse(configStr));
        const auth = getAuth(app);
        const db = getFirestore(app);
        setGlobalDb(db);

        if (
          typeof __initial_auth_token !== "undefined" &&
          __initial_auth_token
        ) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }

        unsubscribeAuth = onAuthStateChanged(auth, setUser);
      } catch (err) {
        console.warn("Running in local mock mode without Firebase");
        setUser({ uid: "mock-user-123", isMock: true });
        setProperties(
          defaultProperties.map((p, i) => ({ id: `prop-${i}`, ...p }))
        );
        setLoading(false);
      }
    };
    initFirebase();
    return () => {
      if (unsubscribeAuth) unsubscribeAuth();
    };
  }, []);

  useEffect(() => {
    if (!user || user.isMock || !globalDb) return;

    // Fetch Properties
    const propsRef = collection(
      globalDb,
      "artifacts",
      appId,
      "public",
      "data",
      "properties"
    );
    const unsubProps = onSnapshot(
      propsRef,
      async (snap) => {
        if (snap.empty) {
          // Seed database if empty
          for (const p of defaultProperties) await addDoc(propsRef, p);
        } else {
          setProperties(
            snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
          );
        }
        setLoading(false);
      },
      (err) => console.error("Props Error:", err)
    );

    // Fetch Investments
    const invRef = collection(
      globalDb,
      "artifacts",
      appId,
      "users",
      user.uid,
      "investments"
    );
    const unsubInv = onSnapshot(
      invRef,
      (snap) => {
        setInvestments(snap.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
      },
      (err) => console.error("Inv Error:", err)
    );

    return () => {
      unsubProps();
      unsubInv();
    };
  }, [user, globalDb]);

  // Handlers
  const handleInvest = async (amount) => {
    if (kycStatus < 3) {
      alert("Please complete your KYC first!");
      setActiveTab("profile");
      setShowInvestModal(false);
      setSelectedProperty(null);
      return;
    }

    try {
      if (!user.isMock && globalDb) {
        // Add investment record
        await addDoc(
          collection(
            globalDb,
            "artifacts",
            appId,
            "users",
            user.uid,
            "investments"
          ),
          {
            propertyId: selectedProperty.id,
            propertyName: selectedProperty.name,
            amount_invested: amount,
            ownership_share: (amount / selectedProperty.total_value) * 100,
            date: new Date().toISOString(),
          }
        );
        // Update property funding
        const propRef = doc(
          globalDb,
          "artifacts",
          appId,
          "public",
          "data",
          "properties",
          selectedProperty.id
        );
        await updateDoc(propRef, {
          current_funding: selectedProperty.current_funding + amount,
        });
      } else {
        // Mock State Update
        setInvestments([
          ...investments,
          {
            id: Date.now().toString(),
            propertyId: selectedProperty.id,
            propertyName: selectedProperty.name,
            amount_invested: amount,
            ownership_share: (amount / selectedProperty.total_value) * 100,
          },
        ]);
        setProperties(
          properties.map((p) =>
            p.id === selectedProperty.id
              ? { ...p, current_funding: p.current_funding + amount }
              : p
          )
        );
      }
      setShowInvestModal(false);
      setSelectedProperty(null);
      setActiveTab("portfolio");
    } catch (e) {
      console.error("Investment failed", e);
    }
  };

  // --- Views ---

  const renderMarketplace = () => (
    <div className="p-5 pb-24">
      <div className="flex justify-between items-center mb-6 pt-2">
        <div>
          <p className="text-slate-500 text-sm font-medium">Hello Investor,</p>
          <h1 className="text-2xl font-bold text-slate-900">Discover Assets</h1>
        </div>
        <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center text-white font-bold shadow-md">
          {user?.uid?.substring(0, 2).toUpperCase() || "U"}
        </div>
      </div>

      <div className="space-y-6">
        {properties.map((prop) => {
          const fundedPercent = (prop.current_funding / prop.total_value) * 100;
          return (
            <div
              key={prop.id}
              onClick={() => setSelectedProperty(prop)}
              className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden cursor-pointer active:scale-[0.98] transition-transform"
            >
              <div className="h-48 relative">
                <img
                  src={prop.image}
                  alt={prop.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-bold text-slate-900 flex items-center gap-1 shadow-sm">
                  <ShieldCheck size={14} className="text-emerald-500" /> Grade-A
                </div>
              </div>
              <div className="p-5">
                <h3 className="text-lg font-bold text-slate-900">
                  {prop.name}
                </h3>
                <p className="text-slate-500 text-sm flex items-center gap-1 mt-1 mb-4">
                  <MapPin size={14} /> {prop.location}
                </p>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Target Yield</p>
                    <p className="font-bold text-emerald-600 text-lg">
                      {prop.rental_yield}%
                    </p>
                  </div>
                  <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                    <p className="text-xs text-slate-500 mb-1">Min. Invest</p>
                    <p className="font-bold text-slate-900 text-lg">
                      {formatINR(prop.min_investment)}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-bold mb-1">
                    <span className="text-emerald-600">
                      {fundedPercent.toFixed(1)}% Funded
                    </span>
                    <span className="text-slate-500">
                      {formatINR(prop.total_value)}
                    </span>
                  </div>
                  <LinearProgress
                    current={prop.current_funding}
                    total={prop.total_value}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderPropertyDetails = () => {
    const prop = selectedProperty;
    return (
      <div className="absolute inset-0 bg-slate-50 z-40 overflow-y-auto hide-scrollbar">
        <div className="relative h-72">
          <img
            src={prop.image}
            className="w-full h-full object-cover"
            alt={prop.name}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 to-transparent"></div>
          <button
            onClick={() => setSelectedProperty(null)}
            className="absolute top-6 left-5 w-10 h-10 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center text-white"
          >
            <ChevronLeft size={24} />
          </button>
          <div className="absolute bottom-5 left-5 right-5">
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-1 rounded-md flex items-center gap-1">
                <CheckCircle2 size={12} /> RERA Verified
              </span>
              <span className="bg-white/20 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded-md">
                {prop.type}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-1">{prop.name}</h1>
            <p className="text-slate-300 text-sm flex items-center gap-1">
              <MapPin size={14} /> {prop.location}
            </p>
          </div>
        </div>

        <div className="p-5 pb-32">
          <div className="flex justify-between items-center bg-white p-5 rounded-2xl shadow-sm border border-slate-100 -mt-8 relative z-10">
            <div>
              <p className="text-slate-500 text-sm mb-1">Funding Status</p>
              <p className="text-xl font-bold text-slate-900">
                {formatINR(prop.current_funding)}
              </p>
              <p className="text-xs text-slate-400 mt-1">
                of {formatINR(prop.total_value)}
              </p>
            </div>
            <CircularProgress
              current={prop.current_funding}
              total={prop.total_value}
            />
          </div>

          <div className="mt-6">
            <h3 className="font-bold text-lg text-slate-900 mb-2">Overview</h3>
            <p className="text-slate-600 text-sm leading-relaxed">
              {prop.description}
            </p>
            <div className="mt-3 p-3 bg-slate-100 text-slate-600 text-xs rounded-lg flex items-start gap-2">
              <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <p>
                RERA Registration Number:{" "}
                <span className="font-bold text-slate-700">{prop.rera}</span>
              </p>
            </div>
          </div>

          <InvestmentCalculator property={prop} />
        </div>

        {/* Sticky Invest Button */}
        <div className="fixed bottom-0 w-full max-w-[400px] p-5 bg-white border-t border-slate-200 z-50">
          <button
            onClick={() => setShowInvestModal(true)}
            className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-slate-800 transition-colors"
          >
            Invest Now
          </button>
        </div>
      </div>
    );
  };

  const renderPortfolio = () => {
    const totalInvested = investments.reduce(
      (acc, curr) => acc + curr.amount_invested,
      0
    );
    // Mock calculation for demo
    const weightedYield = investments.length > 0 ? 8.5 : 0;
    const capitalAppreciation = totalInvested * 0.04; // 4% dummy appreciation

    return (
      <div className="p-5 pb-24">
        <h1 className="text-2xl font-bold text-slate-900 mb-6 pt-2">
          My Portfolio
        </h1>

        <div className="bg-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden mb-8">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500 opacity-20 rounded-full blur-3xl transform translate-x-10 -translate-y-10"></div>
          <p className="text-slate-400 text-sm font-medium mb-1">
            Total Portfolio Value
          </p>
          <h2 className="text-4xl font-bold mb-6">
            {formatINR(totalInvested + capitalAppreciation)}
          </h2>

          <div className="flex gap-6 border-t border-slate-700 pt-5">
            <div>
              <p className="text-slate-400 text-xs mb-1">Net Rental Yield</p>
              <p className="font-bold text-emerald-400 text-lg">
                {weightedYield}%
              </p>
            </div>
            <div>
              <p className="text-slate-400 text-xs mb-1">
                Capital Appreciation
              </p>
              <p className="font-bold text-emerald-400 text-lg">
                +{formatINR(capitalAppreciation)}
              </p>
            </div>
          </div>
        </div>

        <h3 className="font-bold text-lg text-slate-900 mb-4">My Assets</h3>
        {investments.length === 0 ? (
          <div className="text-center py-10 bg-slate-100 rounded-2xl border-dashed border-2 border-slate-200">
            <Building className="mx-auto text-slate-300 mb-3" size={40} />
            <p className="text-slate-500 font-medium">No investments yet.</p>
            <button
              onClick={() => setActiveTab("home")}
              className="mt-3 text-emerald-600 font-bold text-sm"
            >
              Explore Properties
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {investments.map((inv, idx) => (
              <div
                key={idx}
                className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-slate-900 text-sm mb-1">
                    {inv.propertyName}
                  </h4>
                  <div className="flex items-center gap-3 text-xs text-slate-500">
                    <span className="bg-slate-100 px-2 py-1 rounded">
                      {inv.ownership_share.toFixed(4)}% Share
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">
                    {formatINR(inv.amount_invested)}
                  </p>
                  <p className="text-xs font-semibold text-emerald-500 mt-1 flex items-center justify-end gap-1">
                    <TrendingUp size={12} /> Active
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderP2P = () => (
    <div className="p-5 pb-24">
      <div className="mb-6 pt-2">
        <h1 className="text-2xl font-bold text-slate-900">Secondary Market</h1>
        <p className="text-slate-500 text-sm mt-1">
          Trade property fractions peer-to-peer
        </p>
      </div>

      <div className="space-y-4">
        {mockP2PListings.map((listing) => (
          <div
            key={listing.id}
            className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm"
          >
            <div className="flex justify-between items-start mb-3">
              <div>
                <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md mb-2 inline-block">
                  Yield: {listing.yield}%
                </span>
                <h3 className="font-bold text-slate-900">
                  {listing.propertyName}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Listed by {listing.seller}
                </p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-slate-900">
                  {formatINR(listing.asking_price)}
                </p>
                <p className="text-xs font-medium text-slate-500 mt-1">
                  {listing.fraction_percentage}% Fraction
                </p>
              </div>
            </div>
            <button className="w-full mt-2 py-3 bg-slate-50 text-slate-900 font-bold rounded-xl border border-slate-200 hover:bg-slate-100 transition-colors">
              Buy Fraction
            </button>
          </div>
        ))}
      </div>
    </div>
  );

  const renderKYC = () => {
    return (
      <div className="p-5 pb-24 h-full flex flex-col">
        <h1 className="text-2xl font-bold text-slate-900 pt-2 mb-6">
          Profile & KYC
        </h1>

        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex-1">
          {kycStatus === 3 ? (
            <div className="text-center py-10">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShieldCheck size={40} />
              </div>
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                KYC Verified
              </h2>
              <p className="text-slate-500">
                You are fully verified and ready to invest.
              </p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-900 mb-6">
                Complete Onboarding
              </h2>
              {/* Stepper UI */}
              <div className="flex items-center mb-8">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    kycStatus >= 0
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  1
                </div>
                <div
                  className={`flex-1 h-1 mx-2 ${
                    kycStatus >= 1 ? "bg-emerald-500" : "bg-slate-100"
                  }`}
                ></div>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    kycStatus >= 1
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  2
                </div>
                <div
                  className={`flex-1 h-1 mx-2 ${
                    kycStatus >= 2 ? "bg-emerald-500" : "bg-slate-100"
                  }`}
                ></div>
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    kycStatus >= 2
                      ? "bg-emerald-500 text-white"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  3
                </div>
              </div>

              {kycStatus === 0 && (
                <div className="animate-fade-in">
                  <h3 className="font-bold text-lg mb-2">
                    Aadhaar Verification
                  </h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Enter your 12-digit Aadhaar number for biometric e-KYC.
                  </p>
                  <input
                    type="text"
                    placeholder="XXXX XXXX XXXX"
                    className="w-full p-4 border border-slate-200 rounded-xl mb-4 text-center tracking-widest text-lg font-medium focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    onClick={() => setKycStatus(1)}
                    className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold"
                  >
                    Send OTP
                  </button>
                </div>
              )}

              {kycStatus === 1 && (
                <div className="animate-fade-in">
                  <h3 className="font-bold text-lg mb-2">Verify OTP</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Enter the OTP sent to your Aadhaar linked mobile.
                  </p>
                  <input
                    type="text"
                    placeholder="------"
                    className="w-full p-4 border border-slate-200 rounded-xl mb-4 text-center tracking-widest text-2xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    onClick={() => setKycStatus(2)}
                    className="w-full bg-slate-900 text-white p-4 rounded-xl font-bold"
                  >
                    Verify & Proceed
                  </button>
                </div>
              )}

              {kycStatus === 2 && (
                <div className="animate-fade-in">
                  <h3 className="font-bold text-lg mb-2">PAN Card Details</h3>
                  <p className="text-sm text-slate-500 mb-6">
                    Provide your PAN for tax compliance.
                  </p>
                  <input
                    type="text"
                    placeholder="ABCDE1234F"
                    className="w-full p-4 border border-slate-200 rounded-xl mb-4 text-center tracking-widest text-lg font-bold uppercase focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                  <button
                    onClick={() => setKycStatus(3)}
                    className="w-full bg-emerald-500 text-white p-4 rounded-xl font-bold"
                  >
                    Complete KYC
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  const InvestBottomSheet = () => {
    if (!showInvestModal || !selectedProperty) return null;
    const [invAmt, setInvAmt] = useState(selectedProperty.min_investment);

    return (
      <div className="absolute inset-0 z-50 flex flex-col justify-end bg-slate-900/60 backdrop-blur-sm p-4">
        <div className="bg-white rounded-3xl p-6 shadow-2xl animate-slide-up w-full">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-900">Invest</h3>
            <button
              onClick={() => setShowInvestModal(false)}
              className="bg-slate-100 p-2 rounded-full text-slate-500 hover:bg-slate-200"
            >
              <ChevronLeft className="rotate-[-90deg]" size={20} />
            </button>
          </div>

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 mb-6">
            <p className="text-xs text-slate-500 mb-1">Property</p>
            <p className="font-bold text-slate-900">{selectedProperty.name}</p>
          </div>

          <label className="text-sm font-bold text-slate-700 block mb-3">
            Enter Amount
          </label>
          <div className="relative mb-8">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <IndianRupee size={20} className="text-slate-400" />
            </div>
            <input
              type="number"
              min={selectedProperty.min_investment}
              step="1000"
              value={invAmt}
              onChange={(e) => setInvAmt(Number(e.target.value))}
              className="w-full pl-10 p-4 bg-white border-2 border-slate-200 rounded-xl text-xl font-bold text-slate-900 focus:border-emerald-500 focus:ring-0 outline-none transition-colors"
            />
          </div>

          <button
            onClick={() => handleInvest(invAmt)}
            className="w-full bg-emerald-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg hover:bg-emerald-600 transition-colors flex items-center justify-center gap-2"
          >
            Confirm Payment <ArrowUpRight size={20} />
          </button>
        </div>
      </div>
    );
  };

  // --- Main Render ---
  if (loading)
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="animate-pulse flex flex-col items-center">
          <div className="w-12 h-12 bg-emerald-500 rounded-full mb-4"></div>
          <div className="text-slate-400 font-bold tracking-widest uppercase text-sm">
            Loading Platform...
          </div>
        </div>
      </div>
    );

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
        * { font-family: 'Inter', sans-serif; }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes slideUp { from { transform: translateY(100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        .animate-slide-up { animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .animate-fade-in { animation: fadeIn 0.4s ease-out forwards; }
      `,
        }}
      />

      <div className="min-h-screen bg-black flex justify-center items-center p-0 sm:p-4">
        <div className="w-full max-w-[420px] h-[100dvh] sm:h-[850px] bg-slate-50 relative overflow-hidden flex flex-col shadow-2xl sm:rounded-[2.5rem] sm:border-[8px] border-slate-900">
          {/* Main Scrollable Content */}
          <div className="flex-1 overflow-y-auto hide-scrollbar relative">
            {selectedProperty && !showInvestModal ? (
              renderPropertyDetails()
            ) : (
              <>
                {activeTab === "home" && renderMarketplace()}
                {activeTab === "portfolio" && renderPortfolio()}
                {activeTab === "p2p" && renderP2P()}
                {activeTab === "profile" && renderKYC()}
              </>
            )}
          </div>

          {/* Bottom Sheet Overlay */}
          <InvestBottomSheet />

          {/* Bottom Navigation */}
          {(!selectedProperty || showInvestModal) && (
            <div className="absolute bottom-0 w-full bg-white border-t border-slate-100 flex justify-around p-2 pb-6 sm:pb-4 z-40 rounded-b-[2rem]">
              <NavItem
                icon={<Home />}
                label="Home"
                active={activeTab === "home"}
                onClick={() => {
                  setActiveTab("home");
                  setSelectedProperty(null);
                }}
              />
              <NavItem
                icon={<Briefcase />}
                label="Portfolio"
                active={activeTab === "portfolio"}
                onClick={() => {
                  setActiveTab("portfolio");
                  setSelectedProperty(null);
                }}
              />
              <NavItem
                icon={<ArrowRightLeft />}
                label="Trade"
                active={activeTab === "p2p"}
                onClick={() => {
                  setActiveTab("p2p");
                  setSelectedProperty(null);
                }}
              />
              <NavItem
                icon={<User />}
                label="Profile"
                active={activeTab === "profile"}
                onClick={() => {
                  setActiveTab("profile");
                  setSelectedProperty(null);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </>
  );
}

const NavItem = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center p-2 min-w-[64px] transition-colors ${
      active ? "text-emerald-500" : "text-slate-400 hover:text-slate-600"
    }`}
  >
    {React.cloneElement(icon, { size: 22, strokeWidth: active ? 2.5 : 2 })}
    <span
      className={`text-[10px] mt-1 font-semibold ${
        active ? "text-emerald-500" : "text-slate-500"
      }`}
    >
      {label}
    </span>
  </button>
);
