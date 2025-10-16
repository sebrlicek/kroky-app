import React, { useState, useEffect } from "react";
import emailjs from "emailjs-com";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

// EmailJS konfigurace
const EMAILJS_SERVICE_ID = "service_3j2qrmh";
const EMAILJS_TEMPLATE_ID = "template_o1ojiar";
const EMAILJS_PUBLIC_KEY = "dCoz5iUpc4pg0B4nz";

export default function App() {
  const STORAGE_USERS_KEY = "krokyAppUsers";

  const [loggedInUser, setLoggedInUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [codeInput, setCodeInput] = useState("");
  const [entries, setEntries] = useState([]);
  const [stepsInput, setStepsInput] = useState(0);
  const [editingId, setEditingId] = useState(null);

  const today = new Date().toISOString().slice(0, 10);

  // vytvoření admin účtu
  useEffect(() => {
    const usersRaw = localStorage.getItem(STORAGE_USERS_KEY);
    const users = usersRaw ? JSON.parse(usersRaw) : {};
    if (!users.admin) {
      users.admin = {
        password: "admin",
        email: "admin@local",
        verified: true,
      };
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    }
  }, []);

  // načtení dat po přihlášení
  useEffect(() => {
    if (!loggedInUser) return;
    const usersRaw = localStorage.getItem(STORAGE_USERS_KEY);
    const users = JSON.parse(usersRaw || "{}");

    if (loggedInUser === "admin") {
      let allEntries = [];
      Object.keys(users).forEach((u) => {
        const raw = localStorage.getItem(`krokyData-${u}`);
        if (raw) {
          const data = JSON.parse(raw);
          data.forEach((e) => (e.user = u));
          allEntries = allEntries.concat(data);
        }
      });
      setEntries(allEntries);
    } else {
      const raw = localStorage.getItem(`krokyData-${loggedInUser}`);
      if (raw) setEntries(JSON.parse(raw));
    }
  }, [loggedInUser]);

  // ukládání záznamů
  useEffect(() => {
    if (!loggedInUser || loggedInUser === "admin") return;
    localStorage.setItem(`krokyData-${loggedInUser}`, JSON.stringify(entries));
  }, [entries, loggedInUser]);

  // odeslání ověřovacího e-mailu
  const sendVerificationEmail = async (email, username, code) => {
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: email,
          to_name: username,
          verification_code: code,
        },
        EMAILJS_PUBLIC_KEY
      );
      console.log("✅ E-mail odeslán");
    } catch (err) {
      console.error("❌ Chyba při odesílání e-mailu:", err);
    }
  };

  // registrace
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!usernameInput || !passwordInput || !emailInput)
      return alert("Vyplň všechny údaje.");

    const users = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || "{}");
    if (users[usernameInput]) return alert("Uživatel už existuje.");

    const code = Math.floor(100000 + Math.random() * 900000).toString();

    users[usernameInput] = {
      password: passwordInput,
      email: emailInput,
      verified: false,
      code,
    };
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));

    await sendVerificationEmail(emailInput, usernameInput, code);
    setIsVerifying(true);
  };

  // ověření kódu
  const handleVerification = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || "{}");
    const user = users[usernameInput];
    if (!user) return alert("Uživatel nenalezen.");
    if (user.code === codeInput) {
      user.verified = true;
      delete user.code;
      users[usernameInput] = user;
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
      alert("Účet ověřen! Můžeš se přihlásit.");
      setIsRegistering(false);
      setIsVerifying(false);
      setUsernameInput("");
      setPasswordInput("");
      setEmailInput("");
      setCodeInput("");
    } else {
      alert("Nesprávný ověřovací kód.");
    }
  };

  // login
  const handleLogin = (e) => {
    e.preventDefault();
    const users = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || "{}");
    const user = users[usernameInput];
    if (!user) return alert("Uživatel neexistuje.");
    if (!user.verified) return alert("Účet zatím není ověřen.");
    if (user.password !== passwordInput) return alert("Špatné heslo.");
    setLoggedInUser(usernameInput);
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setEntries([]);
  };

  const addOrUpdateEntry = (e) => {
    e.preventDefault();
    const steps = Number(stepsInput) || 0;
    if (editingId) {
      setEntries((prev) =>
        prev.map((p) => (p.id === editingId ? { ...p, steps } : p))
      );
      setEditingId(null);
    } else {
      setEntries((prev) => {
        const filtered = prev.filter((p) => p.date !== today);
        const newEntry = {
          id: crypto.randomUUID(),
          date: today,
          steps,
          user: loggedInUser,
        };
        return [...filtered, newEntry].sort((a, b) => a.date.localeCompare(b.date));
      });
    }
    setStepsInput(0);
  };

  const startEdit = (entry) => {
    setStepsInput(entry.steps);
    setEditingId(entry.id);
  };

  const removeEntry = (id) => {
    if (confirm("Smazat tento záznam?"))
      setEntries((prev) => prev.filter((p) => p.id !== id));
  };

  const clearAll = () => {
    if (confirm("Smazat všechny záznamy?")) {
      setEntries([]);
      localStorage.removeItem(`krokyData-${loggedInUser}`);
    }
  };

  const deleteUser = (user) => {
    if (confirm(`Smazat uživatele ${user}?`)) {
      const users = JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || "{}");
      delete users[user];
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
      localStorage.removeItem(`krokyData-${user}`);
      setEntries((prev) => prev.filter((e) => e.user !== user));
    }
  };

  const chartData = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ date: e.date, kroky: Number(e.steps), user: e.user }));

  // Přihlášení / registrace / ověření
  if (!loggedInUser) {
    if (isVerifying) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-blue-50">
          <form
            onSubmit={handleVerification}
            className="bg-white p-8 rounded-2xl shadow space-y-4 w-80 text-center"
          >
            <h1 className="text-2xl font-bold text-blue-700 mb-2">Ověření účtu</h1>
            <input
              type="text"
              placeholder="Ověřovací kód"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
            <button
              type="submit"
              className="w-full px-4 py-2 rounded-xl bg-blue-600 text-white font-medium"
            >
              Ověřit
            </button>
          </form>
        </div>
      );
    }

    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <form
          onSubmit={isRegistering ? handleRegister : handleLogin}
          className="bg-white p-8 rounded-2xl shadow space-y-4 w-80 text-center"
        >
          <h1 className="text-2xl font-bold text-blue-700 mb-2">
            {isRegistering ? "Registrace" : "Přihlášení"}
          </h1>
          <input
            type="text"
            placeholder="Uživatelské jméno"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
          <input
            type="password"
            placeholder="Heslo"
            value={passwordInput}
            onChange={(e) => setPasswordInput(e.target.value)}
            className="w-full p-2 border rounded-md"
          />
          {isRegistering && (
            <input
              type="email"
              placeholder="E-mail"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              className="w-full p-2 border rounded-md"
            />
          )}
          <button
            type="submit"
            className="w-full px-4 py-2 rounded-xl bg-blue-600 text-white font-medium"
          >
            {isRegistering ? "Registrovat" : "Přihlásit se"}
          </button>
          <p className="text-sm text-blue-700 mt-2">
            {isRegistering ? "Máš účet?" : "Nemáš účet?"}{" "}
            <button
              type="button"
              onClick={() => setIsRegistering(!isRegistering)}
              className="underline"
            >
              {isRegistering ? "Přihlásit se" : "Registrovat"}
            </button>
          </p>
        </form>
      </div>
    );
  }

  // Hlavní aplikace
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-blue-700">Moje denní kroky</h1>
          <button
            onClick={handleLogout}
            className="px-3 py-1 rounded-xl border border-red-400 text-red-600 text-sm"
          >
            Odhlásit ({loggedInUser})
          </button>
        </header>

        {/* sekce přidání záznamů */}
        {loggedInUser !== "admin" && (
          <section className="bg-white rounded-2xl shadow p-4 mb-6">
            <form onSubmit={addOrUpdateEntry} className="space-y-3">
              <div className="flex gap-2 items-center">
                <label className="w-20 text-sm text-blue-600">Dnes</label>
                <span className="flex-1 p-2 border rounded-md bg-gray-100 text-gray-700">
                  {today}
                </span>
              </div>
              <div className="flex gap-2 items-center">
                <label className="w-20 text-sm text-blue-600">Kroky</label>
                <input
                  type="number"
                  value={stepsInput}
                  onChange={(e) => setStepsInput(e.target.value)}
                  className="flex-1 p-2 border rounded-md"
                  min={0}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium"
                >
                  {editingId ? "Uložit změnu" : "Přidat záznam"}
                </button>
                <button
                  type="button"
                  onClick={() => setStepsInput(0)}
                  className="px-4 py-2 rounded-xl border border-blue-200 text-blue-700"
                >
                  Reset
                </button>
                {entries.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAll}
                    className="px-4 py-2 rounded-xl bg-red-500 text-white font-medium"
                  >
                    Vymazat vše
                  </button>
                )}
              </div>
            </form>
          </section>
        )}

        {/* graf */}
        <section className="bg-white rounded-2xl shadow p-4 mb-6">
          <h2 className="font-semibold text-blue-700 mb-2">Graf kroků</h2>
          <div style={{ height: 260 }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="kroky"
                  stroke="#1D4ED8"
                  strokeWidth={3}
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* tabulka */}
        <section className="bg-white rounded-2xl shadow p-4 mb-6">
          <h3 className="text-lg font-medium text-blue-700 mb-3">Záznamy</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm table-auto">
              <thead>
                <tr className="text-left text-blue-600">
                  {loggedInUser === "admin" && <th className="p-2">Uživatel</th>}
                  <th className="p-2">Datum</th>
                  <th className="p-2">Kroky</th>
                  <th className="p-2">Akce</th>
                </tr>
              </thead>
              <tbody>
                {[...entries]
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .map((entry) => (
                    <tr key={entry.id} className="border-t">
                      {loggedInUser === "admin" && (
                        <td className="p-2">{entry.user}</td>
                      )}
                      <td className="p-2">{entry.date}</td>
                      <td className="p-2">{entry.steps.toLocaleString()}</td>
                      <td className="p-2">
                        {loggedInUser !== "admin" && (
                          <>
                            <button
                              onClick={() => startEdit(entry)}
                              className="mr-2 text-sm px-3 py-1 rounded-md border border-blue-100"
                            >
                              Upravit
                            </button>
                            <button
                              onClick={() => removeEntry(entry.id)}
                              className="text-sm px-3 py-1 rounded-md bg-red-50 text-red-600 border border-red-100"
                            >
                              Smazat
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                {entries.length === 0 && (
                  <tr>
                    <td
                      colSpan={loggedInUser === "admin" ? 4 : 3}
                      className="p-4 text-center text-gray-500"
                    >
                      Zatím žádné záznamy.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        {/* sekce admin */}
        {loggedInUser === "admin" && (
          <section className="bg-white rounded-2xl shadow p-4 mt-6">
            <h3 className="text-lg font-medium text-blue-700 mb-3">
              Všichni uživatelé
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-auto">
                <thead>
                  <tr className="text-left text-blue-600">
                    <th className="p-2">Uživatel</th>
                    <th className="p-2">E-mail</th>
                    <th className="p-2">Ověřen</th>
                    <th className="p-2">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(
                    JSON.parse(localStorage.getItem(STORAGE_USERS_KEY) || "{}")
                  )
                    .filter(([user]) => user !== "admin")
                    .map(([user,
