import React, { useEffect, useState, ElementType, Fragment } from "react";
import { isConnected, requestAccess, getAddress } from "@stellar/freighter-api";
import { createUser, createContract } from "./contract";
import {
  HomeIcon,
  UserIcon,
  ClipboardIcon,
  Bars3Icon,
  XMarkIcon,
  SunIcon,
  MoonIcon,
  WalletIcon,
  CubeTransparentIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import { Transition, Dialog } from "@headlessui/react";

type NavKey = "dashboard" | "services" | "profile" | "history";

interface Transaction {
  id: string;
  type: 'register' | 'contract';
  serviceId?: string;
  serviceName?: string;
  amount?: string;
  timestamp: number;
  status: 'success' | 'failed' | 'pending';
  txHash?: string;
  error?: string;
  userRating?: number; // User's rating for the service (1-5)
}

interface Service {
  id: string;
  title: string;
  desc: string;
  price: string;
  provider: string;
  rating: number;
}

// A simple, reusable logo component
function Logo() {
  return (
    <div className="flex items-center gap-2">
      <CubeTransparentIcon className="w-8 h-8 text-indigo-500" />
      <div className="flex flex-col">
        <span className="text-lg font-bold text-gray-800 dark:text-white">LocServ</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">Servicios Locales</span>
      </div>
    </div>
  );
}

export default function App() {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [myServices, setMyServices] = useState<Service[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [route, setRoute] = useState<NavKey>("dashboard");
  const [showTxModal, setShowTxModal] = useState(false);
  const [currentTxHash, setCurrentTxHash] = useState<string | null>(null);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [themeDark, setThemeDark] = useState<boolean>(() => {
    // Check for saved theme preference
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark';
    }
    return false;
  });

  const pushLog = (t: string) =>
    setLogs((s) => [`[${new Date().toLocaleTimeString()}] ${t}`, ...s].slice(0, 100));

  const handleRegister = async () => {
    if (!publicKey) {
      pushLog("⚠️ Por favor conecta tu wallet primero");
      return;
    }
    const txId = `REG-${Date.now()}`;
    try {
      pushLog("📝 Registrando usuario...");
      const response = await createUser(publicKey, "Usuario", "Demo", "Test", "demo@example.com", 123);
      pushLog("✅ Usuario registrado exitosamente");

      // Add to transaction history
      setTransactions(prev => [{
        id: txId,
        type: 'register',
        timestamp: Date.now(),
        status: 'success',
        txHash: response?.hash || 'N/A'
      }, ...prev]);
    } catch (e: any) {
      console.error(e);

      // Check if it's a "user already exists" error
      if (e.message && (e.message.includes('Error(Contract, #2)') || e.message.includes('Simulation failed'))) {
        pushLog("⚠️ Este usuario ya está registrado en el contrato");
        pushLog("💡 Cambia a otra cuenta en Freighter para crear un nuevo usuario");
        // Don't add to history - this is expected behavior, not an error
      } else {
        pushLog(`❌ Error al registrar: ${e.message}`);
        // Only add unexpected errors to history
        setTransactions(prev => [{
          id: txId,
          type: 'register',
          timestamp: Date.now(),
          status: 'failed',
          error: e.message
        }, ...prev]);
      }
    }
  };

  const handleHire = async (serviceId: string, price: string) => {
    if (!publicKey) {
      pushLog("Por favor conecta tu wallet primero");
      return;
    }
    const contractId = `C-${Date.now()}`;
    const service = demoServices.find(s => s.id === serviceId);
    try {
      pushLog(`Contratando servicio ${serviceId}...`);
      const numericPrice = parseInt(price.replace(/[^0-9]/g, '')) || 100;

      const response = await createContract(
        contractId,
        serviceId,
        publicKey,
        new Date().toISOString().split('T')[0],
        new Date(Date.now() + 86400000).toISOString().split('T')[0],
        numericPrice
      );

      if (response && response.hash) {
        pushLog(`✅ Contrato creado: ${contractId}`);
        pushLog(` Hash: ${response.hash}`);
        pushLog(` Estado: ${response.status}`);
        pushLog(` Fee gastado: ~0.0001 XLM`);

        // Show success modal
        setCurrentTxHash(response.hash);
        setShowTxModal(true);

        // Add to transaction history
        setTransactions(prev => [{
          id: contractId,
          type: 'contract',
          serviceId,
          serviceName: service?.title || serviceId,
          amount: price,
          timestamp: Date.now(),
          status: 'success',
          txHash: response.hash
        }, ...prev]);
      } else {
        pushLog(`⚠️ Transacción enviada pero sin confirmación`);
      }
    } catch (e: any) {
      console.error(e);
      pushLog(`❌ Error al contratar: ${e.message}`);
      setTransactions(prev => [{
        id: contractId,
        type: 'contract',
        serviceId,
        serviceName: service?.title || serviceId,
        amount: price,
        timestamp: Date.now(),
        status: 'failed',
        error: e.message
      }, ...prev]);
    }
  };

  const connectFreighter = async () => {
    try {
      if (publicKey) {
        pushLog("Wallet ya conectada");
        return;
      }

      pushLog("Iniciando conexión con Freighter...");
      const connectedResponse = await isConnected();

      if (!connectedResponse.isConnected) {
        pushLog("⚠️ Freighter no está instalado o detectado");
        return;
      }

      // Intentar obtener la dirección
      let addressResponse = await getAddress();

      // Si no obtenemos dirección, forzamos la solicitud de acceso
      if (!addressResponse || !addressResponse.address) {
        pushLog("Solicitando permiso de acceso al sitio...");
        await requestAccess();
        // Intentar obtener dirección nuevamente después de pedir permisos
        addressResponse = await getAddress();
      }

      if (addressResponse && addressResponse.address) {
        pushLog(`Wallet conectada: ${addressResponse.address}`);
        setPublicKey(addressResponse.address);
      } else {
        pushLog("❌ No se pudo obtener la clave pública. Por favor abre Freighter y autoriza este sitio.");
      }
    } catch (err: any) {
      console.error(err);
      pushLog(`Error al conectar con Freighter: ${err?.message || 'Desconocido'}`);
    }
  };

  const disconnectWallet = () => {
    setPublicKey(null);
    pushLog("Wallet desconectada");
  };

  useEffect(() => {
    // Auto-connect on mount if Freighter is available
    const autoConnect = async () => {
      try {
        const connectedResponse = await isConnected();
        if (connectedResponse.isConnected) {
          const addressResponse = await getAddress();
          if (addressResponse.address) {
            setPublicKey(addressResponse.address);
            pushLog(`Wallet auto-conectada: ${addressResponse.address}`);
          }
        }
      } catch (err) {
        // Freighter not installed or not available
      }
    };
    autoConnect();
  }, []);

  useEffect(() => {
    // Apply theme and save preference
    if (themeDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem('theme', 'light');
    }
  }, [themeDark]);

  const demoServices: Service[] = [
    { id: "S1", title: "Electricista Profesional", desc: "Instalaciones y reparaciones eléctricas seguras.", price: "1,000 XLM", provider: "Carlos Mendoza", rating: 4.8 },
    { id: "S2", title: "Clases de Guitarra Acústica", desc: "Aprende desde cero. Todos los niveles.", price: "1,500 XLM", provider: "Ana García", rating: 4.9 },
    { id: "S3", title: "Plomería de Emergencia", desc: "Solución a fugas, atascos y más, 24/7.", price: "2,000 XLM", provider: "Roberto Silva", rating: 4.7 },
    { id: "S4", title: "Diseño Gráfico y Branding", desc: "Logos, publicidad y material de marca.", price: "4,000 XLM", provider: "Laura Martínez", rating: 5.0 },
    { id: "S5", title: "Asesoría de Jardinería", desc: "Crea y mantén tu jardín ideal.", price: "800 XLM", provider: "Pedro Ramírez", rating: 4.6 },
    { id: "S6", title: "Reparación de Computadoras", desc: "Hardware y software, virus y lentitud.", price: "1,600 XLM", provider: "Miguel Torres", rating: 4.8 },
    { id: "S7", title: "Clases de Yoga", desc: "Sesiones personalizadas o grupales. Mejora tu bienestar.", price: "1,200 XLM", provider: "Sofia López", rating: 4.9 },
    { id: "S8", title: "Carpintería a Medida", desc: "Muebles personalizados y reparaciones de madera.", price: "3,000 XLM", provider: "Jorge Hernández", rating: 4.7 },
    { id: "S9", title: "Fotografía Profesional", desc: "Eventos, retratos y productos. Calidad garantizada.", price: "6,000 XLM", provider: "Diana Ruiz", rating: 5.0 },
    { id: "S10", title: "Limpieza de Hogar", desc: "Servicio completo de limpieza residencial.", price: "1,800 XLM", provider: "María Flores", rating: 4.8 },
    { id: "S11", title: "Clases de Inglés", desc: "Aprende inglés con profesor certificado.", price: "1,400 XLM", provider: "John Smith", rating: 4.9 },
    { id: "S12", title: "Asesoría Legal", desc: "Consultas legales en derecho civil y familiar.", price: "5,000 XLM", provider: "Lic. Patricia Gómez", rating: 4.8 },
    { id: "S13", title: "Desarrollo Web", desc: "Sitios web modernos y responsivos.", price: "10,000 XLM", provider: "David Chen", rating: 5.0 },
    { id: "S14", title: "Paseo de Mascotas", desc: "Cuido y paseo de perros. Servicio confiable.", price: "600 XLM", provider: "Andrea Morales", rating: 4.7 },
    { id: "S15", title: "Clases de Cocina", desc: "Aprende recetas mexicanas e internacionales.", price: "1,700 XLM", provider: "Chef Mario Sánchez", rating: 4.9 },
    { id: "S16", title: "Entrenador Personal", desc: "Rutinas personalizadas y seguimiento nutricional.", price: "2,400 XLM", provider: "Luis Vargas", rating: 4.8 },
    { id: "S17", title: "Clases de Piano", desc: "Desde principiantes hasta avanzados.", price: "1,800 XLM", provider: "Elena Rodríguez", rating: 4.9 },
    { id: "S18", title: "Servicio de Pintura", desc: "Pintura interior y exterior de casas y oficinas.", price: "3,600 XLM", provider: "Antonio Reyes", rating: 4.6 },
    { id: "S19", title: "Asesoría Contable", desc: "Declaraciones fiscales y contabilidad para negocios.", price: "4,400 XLM", provider: "C.P. Rosa Jiménez", rating: 4.8 },
    { id: "S20", title: "Clases de Francés", desc: "Aprende francés con profesor nativo.", price: "1,900 XLM", provider: "Pierre Dubois", rating: 4.7 },
    { id: "S21", title: "Diseño de Interiores", desc: "Transforma tus espacios con estilo profesional.", price: "7,000 XLM", provider: "Isabella Navarro", rating: 5.0 },
    { id: "S22", title: "Reparación de Electrodomésticos", desc: "Lavadoras, refrigeradores, estufas y más.", price: "2,200 XLM", provider: "Fernando Castro", rating: 4.7 },
    { id: "S23", title: "Clases de Programación", desc: "Python, JavaScript, React. Todos los niveles.", price: "3,000 XLM", provider: "Alex Kim", rating: 4.9 },
    { id: "S24", title: "Servicio de Mudanza", desc: "Mudanzas locales seguras y rápidas.", price: "5,600 XLM", provider: "Transportes Veloz", rating: 4.6 },
    { id: "S25", title: "Tutoría Matemáticas", desc: "Clases particulares de matemáticas nivel secundaria y preparatoria.", price: "1,300 XLM", provider: "Prof. Carmen Ortiz", rating: 4.8 },
  ];

  function Header() {
    return (
      <header className="sticky top-0 z-10 flex items-center justify-between px-4 py-3 bg-white/70 dark:bg-gray-900/70 backdrop-blur-lg border-b border-gray-200 dark:border-gray-800">
        <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800 md:hidden">
          <Bars3Icon className="w-6 h-6" />
        </button>
        <div className="hidden md:block">
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white capitalize">{route}</h1>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setThemeDark((v) => !v)}
            className="p-2 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-800"
          >
            {themeDark ? <SunIcon className="w-6 h-6 text-yellow-400" /> : <MoonIcon className="w-6 h-6 text-indigo-500" />}
          </button>

          {!publicKey ? (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={connectFreighter}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-full shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 transition-colors"
            >
              <WalletIcon className="w-5 h-5" />
              <span className="text-sm font-medium">Conectar Wallet</span>
            </motion.button>
          ) : (
            <div className="relative group">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-full shadow-lg shadow-green-500/30 hover:bg-green-700 transition-colors"
              >
                <WalletIcon className="w-5 h-5" />
                <span className="text-sm font-medium">
                  {publicKey.slice(0, 4)}...{publicKey.slice(-4)}
                </span>
              </motion.button>

              {/* Dropdown menu */}
              <div className="absolute right-0 mt-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Wallet Conectada</p>
                  <p className="text-sm font-mono text-gray-700 dark:text-gray-300 break-all">{publicKey}</p>
                </div>
                <div className="p-2">
                  <button
                    onClick={connectFreighter}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                    Cambiar Cuenta
                  </button>
                  <button
                    onClick={disconnectWallet}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors flex items-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    Desconectar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>
    );
  }

  function Sidebar() {
    const NavItem = ({ navKey, icon: Icon, label }: { navKey: NavKey; icon: ElementType; label: string }) => (
      <li>
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={() => {
            setRoute(navKey);
            setSidebarOpen(false);
          }}
          className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${route === navKey
            ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/30"
            : "text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-800"
            }`}
        >
          <Icon className="w-6 h-6" />
          <span>{label}</span>
        </motion.button>
      </li>
    );

    const sidebarContent = (
      <aside className="flex flex-col w-64 p-4 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800">
        <div className="px-2 pt-2 pb-6">
          <Logo />
        </div>
        <nav>
          <ul className="flex flex-col gap-2">
            <NavItem navKey="dashboard" icon={HomeIcon} label="Dashboard" />
            <NavItem navKey="services" icon={ClipboardIcon} label="Servicios" />
            <NavItem navKey="history" icon={ClockIcon} label="Historial" />
            <NavItem navKey="profile" icon={UserIcon} label="Mi Perfil" />
          </ul>
        </nav>
        <div className="mt-auto p-4 bg-gray-100 dark:bg-gray-800/50 rounded-lg">
          <h4 className="font-semibold text-gray-700 dark:text-gray-200">Logs del Sistema</h4>
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-2 h-32 overflow-y-auto font-mono">
            {logs.length > 0 ? logs.map((log, i) => <p key={i}>{log}</p>) : <p>No hay actividad reciente.</p>}
          </div>
        </div>
      </aside>
    );

    return (
      <>
        {/* Mobile Sidebar */}
        <Transition.Root show={sidebarOpen} as={Fragment}>
          <Dialog as="div" className="relative z-40 md:hidden" onClose={setSidebarOpen}>
            <Transition.Child
              as={Fragment}
              enter="transition-opacity ease-linear duration-300"
              enterFrom="opacity-0"
              enterTo="opacity-100"
              leave="transition-opacity ease-linear duration-300"
              leaveFrom="opacity-100"
              leaveTo="opacity-0"
            >
              <div className="fixed inset-0 bg-gray-600 bg-opacity-75" />
            </Transition.Child>
            <div className="fixed inset-0 flex z-40">
              <Transition.Child
                as={Fragment}
                enter="transition ease-in-out duration-300 transform"
                enterFrom="-translate-x-full"
                enterTo="translate-x-0"
                leave="transition ease-in-out duration-300 transform"
                leaveFrom="translate-x-0"
                leaveTo="-translate-x-full"
              >
                <Dialog.Panel className="relative flex-1 flex flex-col max-w-xs w-full">
                  {sidebarContent}
                </Dialog.Panel>
              </Transition.Child>
              <div className="flex-shrink-0 w-14" aria-hidden="true" onClick={() => setSidebarOpen(false)}></div>
            </div>
          </Dialog>
        </Transition.Root>

        {/* Desktop Sidebar */}
        <div className="hidden md:flex md:flex-shrink-0">
          <div className="flex flex-col w-64">
            {sidebarContent}
          </div>
        </div>
      </>
    );
  }


  function PageContent() {
    return (
      <main className="flex-1 p-6 lg:p-8 bg-gray-50 dark:bg-gray-950 overflow-y-auto">
        <AnimatePresence mode="wait">
          <motion.div
            key={route}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {route === "dashboard" && <Dashboard />}
            {route === "services" && <ServicesPage />}
            {route === "history" && <HistoryPage />}
            {route === "profile" && <ProfilePage />}
          </motion.div>
        </AnimatePresence>
      </main>
    );
  }

  // Star Rating Component
  function StarRating({ rating }: { rating: number }) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <svg
            key={star}
            className={`w-4 h-4 ${star <= Math.floor(rating)
              ? 'text-yellow-400 fill-current'
              : star - 0.5 <= rating
                ? 'text-yellow-400 fill-current opacity-50'
                : 'text-gray-300 dark:text-gray-600'
              }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
        <span className="text-xs text-gray-600 dark:text-gray-400 ml-1">
          {rating === 0 ? 'Sin calificaciones' : rating.toFixed(1)}
        </span>
      </div>
    );
  }

  // Combine demo services with user's services
  const allServices = [...demoServices, ...myServices];

  function Dashboard() {
    const StatCard = ({ title, value, icon: Icon, delay = 0 }: { title: string, value: string | number, icon: ElementType, delay?: number }) => (
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5, delay }}
        className="bg-white dark:bg-gray-900 p-6 rounded-2xl shadow-sm hover:shadow-lg transition-shadow flex items-center gap-4"
      >
        <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
          <Icon className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{title}</p>
          <p className="text-2xl font-bold text-gray-800 dark:text-white">{value}</p>
        </div>
      </motion.div>
    );

    return (
      <div className="space-y-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <StatCard title="Servicios Disponibles" value={allServices.length} icon={ClipboardIcon} />
          <StatCard title="Wallet Status" value={publicKey ? "Conectado" : "No Conectado"} icon={WalletIcon} delay={0.1} />
        </div>

        <div>
          <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">Servicios Destacados</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {allServices.slice(0, 3).map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.1 }}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm overflow-hidden flex flex-col"
              >
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-bold text-lg text-gray-800 dark:text-white leading-tight">{s.title}</h4>
                    <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-full whitespace-nowrap">{s.price}</span>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Por: {s.provider}</p>
                    <StarRating rating={s.rating} />
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">{s.desc}</p>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
                  <motion.button
                    onClick={() => handleHire(s.id, s.price)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="w-full bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 font-semibold py-2 rounded-lg transition-colors text-sm"
                  >
                    Solicitar
                  </motion.button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  function ServicesPage() {
    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Todos los Servicios</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {allServices.map((s, i) => {
            // Check if this service belongs to current user
            const isMyService = myServices.some(ms => ms.id === s.id);

            return (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: i * 0.05 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-lg transition-shadow p-5 flex flex-col"
              >
                <div className="flex-grow">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-lg text-gray-800 dark:text-white leading-tight">{s.title}</h3>
                    <div className="flex flex-col items-end gap-1">
                      <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30 px-2 py-1 rounded-full whitespace-nowrap">{s.price}</span>
                      {isMyService && (
                        <span className="text-xs font-semibold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full whitespace-nowrap">
                          Tu servicio
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between mb-3">
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Por: {s.provider}</p>
                    <StarRating rating={s.rating} />
                  </div>

                  <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mb-4">{s.desc}</p>
                </div>

                <motion.button
                  onClick={() => handleHire(s.id, s.price)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-auto w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm"
                >
                  Contratar
                </motion.button>
              </motion.div>
            );
          })}
        </div>
      </div>
    );
  }

  function ProfilePage() {
    const [newService, setNewService] = useState({ title: '', desc: '', price: '' });

    const handleAddService = () => {
      if (!newService.title || !newService.desc || !newService.price) {
        pushLog("⚠️ Por favor completa todos los campos del servicio");
        return;
      }

      const service: Service = {
        id: `USER-S${Date.now()}`,
        title: newService.title,
        desc: newService.desc,
        price: newService.price,
        provider: publicKey ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : "Tú",
        rating: 0 // New services start with no rating
      };

      setMyServices(prev => [...prev, service]);
      setNewService({ title: '', desc: '', price: '' });
      setShowAddServiceModal(false);
      pushLog(`✅ Servicio "${service.title}" agregado exitosamente`);
    };

    return (
      <div className="space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Mi Perfil</h2>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl mx-auto bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-8"
          >
            <div className="flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center mb-4">
                <UserIcon className="w-12 h-12 text-indigo-600 dark:text-indigo-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Mi Wallet</h3>
              <div className="mt-4 p-4 w-full bg-gray-50 dark:bg-gray-800 rounded-lg text-center break-all font-mono text-sm text-gray-600 dark:text-gray-300">
                {publicKey ? publicKey : "No has conectado tu wallet"}
              </div>
              {!publicKey && (
                <motion.button
                  onClick={connectFreighter}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-6 bg-indigo-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Conectar ahora
                </motion.button>
              )}
              {publicKey && (
                <motion.button
                  onClick={handleRegister}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-6 bg-green-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
                >
                  Registrarse (Demo)
                </motion.button>
              )}
            </div>
          </motion.div>
        </div>

        {/* My Services Section */}
        <div>
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-2xl font-bold text-gray-800 dark:text-white">Mis Servicios</h3>
            {publicKey && (
              <motion.button
                onClick={() => setShowAddServiceModal(true)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-indigo-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Ofrecer Servicio
              </motion.button>
            )}
          </div>

          {!publicKey ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">Conecta tu wallet para ofrecer servicios</p>
            </div>
          ) : myServices.length === 0 ? (
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-12 text-center">
              <CubeTransparentIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Aún no has agregado servicios</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">Haz clic en "Ofrecer Servicio" para comenzar</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myServices.map((s, i) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-lg transition-shadow p-5 flex flex-col"
                >
                  <div className="flex-grow">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-bold text-lg text-gray-800 dark:text-white leading-tight">{s.title}</h4>
                      <span className="text-xs font-bold text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-1 rounded-full whitespace-nowrap">{s.price}</span>
                    </div>

                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Por: {s.provider}</p>
                      <StarRating rating={s.rating} />
                    </div>

                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3">{s.desc}</p>
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                    <button
                      onClick={() => {
                        setMyServices(prev => prev.filter(srv => srv.id !== s.id));
                        pushLog(`🗑️ Servicio "${s.title}" eliminado`);
                      }}
                      className="flex-1 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-semibold py-2 rounded-lg transition-colors text-sm hover:bg-red-100 dark:hover:bg-red-900/30"
                    >
                      Eliminar
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  function HistoryPage() {
    const formatDate = (timestamp: number) => {
      return new Date(timestamp).toLocaleString('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    };

    const getStatusBadge = (status: string) => {
      switch (status) {
        case 'success':
          return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300">✅ Exitoso</span>;
        case 'failed':
          return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300">❌ Fallido</span>;
        case 'pending':
          return <span className="px-3 py-1 text-xs font-semibold rounded-full bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300">⏳ Pendiente</span>;
        default:
          return null;
      }
    };

    return (
      <div>
        <h2 className="text-3xl font-bold text-gray-800 dark:text-white mb-6">Historial de Transacciones</h2>

        {transactions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm p-12 text-center"
          >
            <ClockIcon className="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" />
            <h3 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-2">No hay transacciones aún</h3>
            <p className="text-gray-500 dark:text-gray-400">Tus transacciones aparecerán aquí cuando contrates servicios o te registres.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {transactions.map((tx, index) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-sm hover:shadow-lg transition-shadow p-6"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-bold text-gray-800 dark:text-white">
                        {tx.type === 'register' ? '👤 Registro de Usuario' : `🛒 ${tx.serviceName}`}
                      </h3>
                      {getStatusBadge(tx.status)}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">ID de Transacción</p>
                        <p className="text-sm font-mono text-gray-700 dark:text-gray-300">{tx.id}</p>
                      </div>

                      {tx.amount && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Monto</p>
                          <p className="text-sm font-semibold text-indigo-600 dark:text-indigo-400">{tx.amount}</p>
                        </div>
                      )}

                      <div>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Fecha</p>
                        <p className="text-sm text-gray-700 dark:text-gray-300">{formatDate(tx.timestamp)}</p>
                      </div>

                      {tx.txHash && tx.txHash !== 'N/A' && (
                        <div>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Hash de Blockchain</p>
                          <a
                            href={`https://stellar.expert/explorer/testnet/tx/${tx.txHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm font-mono text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-8)}
                          </a>
                        </div>
                      )}
                    </div>

                    {tx.error && (
                      <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Error</p>
                        <p className="text-sm text-red-700 dark:text-red-300">{tx.error}</p>
                      </div>
                    )}

                    {/* Rating Section - Only for successful service contracts */}
                    {tx.type === 'contract' && tx.status === 'success' && (
                      <div className="mt-4 p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg border border-indigo-100 dark:border-indigo-800">
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                          {tx.userRating ? '⭐ Tu calificación' : '📝 Califica este servicio'}
                        </p>
                        <div className="flex items-center gap-3">
                          <InteractiveRating
                            rating={tx.userRating || 0}
                            onRate={(rating) => {
                              setTransactions(prev =>
                                prev.map(t =>
                                  t.id === tx.id ? { ...t, userRating: rating } : t
                                )
                              );
                              pushLog(`⭐ Has calificado "${tx.serviceName}" con ${rating} estrellas`);
                            }}
                          />
                          {tx.userRating && (
                            <span className="text-sm text-gray-600 dark:text-gray-400">
                              {tx.userRating === 5 ? '¡Excelente!' :
                                tx.userRating === 4 ? 'Muy bueno' :
                                  tx.userRating === 3 ? 'Bueno' :
                                    tx.userRating === 2 ? 'Regular' : 'Mejorable'}
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Interactive Rating Component
  function InteractiveRating({ rating, onRate }: { rating: number, onRate: (rating: number) => void }) {
    const [hover, setHover] = useState(0);

    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => onRate(star)}
            onMouseEnter={() => setHover(star)}
            onMouseLeave={() => setHover(0)}
            className="transition-transform hover:scale-125 focus:outline-none"
          >
            <svg
              className={`w-8 h-8 cursor-pointer transition-colors ${star <= (hover || rating)
                ? 'text-yellow-400 fill-current'
                : 'text-gray-300 dark:text-gray-600'
                }`}
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-950 font-sans transition-colors duration-300">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <PageContent />
      </div>

      {/* Transaction Success Modal */}
      <Transition.Root show={showTxModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setShowTxModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                      <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                      </svg>
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                        ¡Transacción Exitosa!
                      </Dialog.Title>
                      <div className="mt-4 space-y-3">
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          Tu transacción ha sido confirmada en la blockchain de Stellar.
                        </p>

                        {currentTxHash && (
                          <>
                            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Hash de Transacción</p>
                              <p className="text-xs font-mono text-gray-700 dark:text-gray-300 break-all">
                                {currentTxHash}
                              </p>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                    <a
                      href={`https://stellar.expert/explorer/testnet/tx/${currentTxHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex w-full justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:col-start-2"
                    >
                      Ver en Stellar Expert
                    </a>
                    <button
                      type="button"
                      className="mt-3 inline-flex w-full justify-center rounded-lg bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 sm:col-start-1 sm:mt-0"
                      onClick={() => setShowTxModal(false)}
                    >
                      Cerrar
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Add Service Modal */}
      <Transition.Root show={showAddServiceModal} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={setShowAddServiceModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
          </Transition.Child>

          <div className="fixed inset-0 z-10 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
                enterTo="opacity-100 translate-y-0 sm:scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 translate-y-0 sm:scale-100"
                leaveTo="opacity-0 translate-y-4 sm:translate-y-0 sm:scale-95"
              >
                <Dialog.Panel className="relative transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                  <div>
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/50">
                      <CubeTransparentIcon className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div className="mt-3 text-center sm:mt-5">
                      <Dialog.Title as="h3" className="text-lg font-semibold leading-6 text-gray-900 dark:text-white">
                        Ofrecer Nuevo Servicio
                      </Dialog.Title>
                      <AddServiceForm
                        onSubmit={(service) => {
                          setMyServices(prev => [...prev, service]);
                          setShowAddServiceModal(false);
                          pushLog(`✅ Servicio "${service.title}" publicado`);
                        }}
                        onCancel={() => setShowAddServiceModal(false)}
                        publicKey={publicKey}
                        pushLog={pushLog}
                      />
                    </div>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition.Root>
    </div>
  );

  function AddServiceForm({ onSubmit, onCancel, publicKey, pushLog }: {
    onSubmit: (service: Service) => void,
    onCancel: () => void,
    publicKey: string | null,
    pushLog: (msg: string) => void
  }) {
    const [title, setTitle] = useState('');
    const [desc, setDesc] = useState('');
    const [price, setPrice] = useState('');

    const handleSubmit = () => {
      if (!title || !desc || !price) {
        pushLog("⚠️ Por favor completa todos los campos");
        return;
      }

      const service: Service = {
        id: `USER-S${Date.now()}`,
        title,
        desc,
        price,
        provider: publicKey ? `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}` : "Tú",
        rating: 0 // New services start with no rating
      };

      onSubmit(service);
      setTitle('');
      setDesc('');
      setPrice('');
    };

    return (
      <>
        <div className="mt-4 space-y-4">
          <div className="text-left">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Título del Servicio
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
              placeholder="Ej: Clases de Piano"
            />
          </div>

          <div className="text-left">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Descripción
            </label>
            <textarea
              rows={3}
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
              placeholder="Describe tu servicio..."
            />
          </div>

          <div className="text-left">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Precio (en XLM)
            </label>
            <input
              type="text"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-lg focus:ring-2 focus:ring-indigo-500 dark:bg-gray-800 dark:text-white"
              placeholder="Ej: 100 XLM"
            />
          </div>
        </div>

        <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
          <button
            type="button"
            className="inline-flex w-full justify-center rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 sm:col-start-2"
            onClick={handleSubmit}
          >
            Publicar Servicio
          </button>
          <button
            type="button"
            className="mt-3 inline-flex w-full justify-center rounded-lg bg-white dark:bg-gray-800 px-3 py-2 text-sm font-semibold text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 sm:col-start-1 sm:mt-0"
            onClick={onCancel}
          >
            Cancelar
          </button>
        </div>
      </>
    );
  }
}