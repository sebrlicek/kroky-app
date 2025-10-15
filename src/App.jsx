import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";

export default function App() {
  const [loggedInUser, setLoggedInUser] = useState(null);
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [entries, setEntries] = useState([]);
  const [stepsInput, setStepsInput] = useState(0);
  const [editingId, setEditingId] = useState(null);

  const today = new Date().toISOString().slice(0, 10);
  const STORAGE_USERS_KEY = "krokyAppUsers";

  // Vytvoření admin účtu při prvním načtení
  useEffect(() => {
    const usersRaw = localStorage.getItem(STORAGE_USERS_KEY);
    const users = usersRaw ? JSON.parse(usersRaw) : {};
    if (!users["admin"]) {
      users["admin"] = "admin";
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    }
  }, []);

  // Načtení záznamů po přihlášení
  useEffect(() => {
    if (!loggedInUser) return;

    const usersRaw = localStorage.getItem(STORAGE_USERS_KEY);
    const users = usersRaw ? JSON.parse(usersRaw) : {};

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

  useEffect(() => {
    if (!loggedInUser) return;
    if (loggedInUser !== "admin") {
      localStorage.setItem(`krokyData-${loggedInUser}`, JSON.stringify(entries));
    }
  }, [entries, loggedInUser]);

  // Registrace
  function handleRegister(e) {
    e.preventDefault();
    if (!usernameInput || !passwordInput) return alert("Vyplň uživatelské jméno i heslo");

    const usersRaw = localStorage.getItem(STORAGE_USERS_KEY);
    const users = usersRaw ? JSON.parse(usersRaw) : {};

    if (users[usernameInput]) return alert("Uživatel již existuje!");

    users[usernameInput] = passwordInput;
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));

    alert("Registrace úspěšná! Přihlaš se.");
    setIsRegistering(false);
    setUsernameInput("");
    setPasswordInput("");
  }

  // Login
  function handleLogin(e) {
    e.preventDefault();
    const usersRaw = localStorage.getItem(STORAGE_USERS_KEY);
    const users = usersRaw ? JSON.parse(usersRaw) : {};
    if (!users[usernameInput] || users[usernameInput] !== passwordInput) {
      return alert("Špatné uživatelské jméno nebo heslo!");
    }
    setLoggedInUser(usernameInput);
    setUsernameInput("");
    setPasswordInput("");
  }

  function handleLogout() {
    setLoggedInUser(null);
    setEntries([]);
  }

  function addOrUpdateEntry(e) {
    e.preventDefault();
    const steps = Number(stepsInput) || 0;
    const date = today;

    if (editingId) {
      setEntries((prev) =>
        prev.map((it) => (it.id === editingId ? { ...it, steps } : it))
      );
      setEditingId(null);
    } else {
      setEntries((prev) => {
        const other = prev.filter((p) => p.date !== date);
        const newEntry = { id: Date.now().toString(), date, steps, user: loggedInUser };
        return [...other, newEntry].sort((a, b) => a.date.localeCompare(b.date));
      });
    }
    setStepsInput(0);
  }

  function startEdit(entry) {
    setStepsInput(entry.steps);
    setEditingId(entry.id);
  }

  function removeEntry(id) {
    if (!confirm("Smazat tento záznam?")) return;
    setEntries((prev) => prev.filter((p) => p.id !== id));
  }

  function clearAll() {
    if (!confirm("Opravdu chceš smazat všechny záznamy?")) return;
    setEntries([]);
    localStorage.removeItem(`krokyData-${loggedInUser}`);
  }

  function deleteUser(user) {
    if (!confirm(`Opravdu chceš smazat uživatele "${user}" a jeho záznamy?`)) return;
    const usersRaw = localStorage.getItem(STORAGE_USERS_KEY);
    const users = usersRaw ? JSON.parse(usersRaw) : {};
    delete users[user];
    localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    localStorage.removeItem(`krokyData-${user}`);
    setEntries((prev) => prev.filter((e) => e.user !== user));
  }

  const chartData = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ date: e.date, kroky: Number(e.steps), user: e.user }));

  // Login / Registrace
  if (!loggedInUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <form
          className="bg-white p-8 rounded-2xl shadow space-y-4 w-80 text-center"
          onSubmit={isRegistering ? handleRegister : handleLogin}
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
          <button
            type="submit"
            className="w-full px-4 py-2 rounded-xl bg-blue-600 text-white font-medium"
          >
            {isRegistering ? "Registrovat" : "Přihlásit se"}
          </button>
          <p className="text-sm text-blue-700 mt-2">
            {isRegistering ? "Máš už účet?" : "Nemáš účet?"}{" "}
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

        {loggedInUser !== "admin" && (
          <section className="bg-white rounded-2xl shadow p-4 mb-6">
            <form onSubmit={addOrUpdateEntry} className="space-y-3">
              <div className="flex gap-2 items-center">
                <label className="w-20 text-sm text-blue-600">Dnes</label>
                <span className="flex-1 p-2 border rounded-md bg-gray-100 text-gray-700">{today}</span>
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
                <button type="submit" className="px-4 py-2 rounded-xl bg-blue-600 text-white font-medium">
                  {editingId ? "Uložit změnu" : "Přidat záznam"}
                </button>
                <button type="button" onClick={() => setStepsInput(0)} className="px-4 py-2 rounded-xl border border-blue-200 text-blue-700">
                  Reset
                </button>
                {entries.length > 0 && (
                  <button type="button" onClick={clearAll} className="px-4 py-2 rounded-xl bg-red-500 text-white font-medium">
                    Vymazat vše
                  </button>
                )}
              </div>
            </form>
          </section>
        )}

        <section className="bg-white rounded-2xl shadow p-4 mb-6">
          <h2 className="font-semibold text-blue-700 mb-2">Graf kroků</h2>
          <div style={{ height: 260 }} className="w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="kroky" stroke="#1D4ED8" strokeWidth={3} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

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
                {[...entries].sort((a,b)=>b.date.localeCompare(a.date)).map(entry=>(
                  <tr key={entry.id} className="border-t">
                    {loggedInUser === "admin" && <td className="p-2 align-top">{entry.user}</td>}
                    <td className="p-2 align-top">{entry.date}</td>
                    <td className="p-2 align-top">{entry.steps.toLocaleString()}</td>
                    <td className="p-2 align-top">
                      {loggedInUser !== "admin" && <>
                        <button onClick={()=>startEdit(entry)} className="mr-2 text-sm px-3 py-1 rounded-md border border-blue-100">Upravit</button>
                        <button onClick={()=>removeEntry(entry.id)} className="text-sm px-3 py-1 rounded-md bg-red-50 text-red-600 border border-red-100">Smazat</button>
                      </>}
                    </td>
                  </tr>
                ))}
                {entries.length===0 && <tr><td colSpan={loggedInUser==="admin"?4:3} className="p-4 text-center text-gray-500">Zatím žádné záznamy. Zapiš dnešní kroky.</td></tr>}
              </tbody>
            </table>
          </div>
        </section>

        {loggedInUser === "admin" && (
          <section className="bg-white rounded-2xl shadow p-4 mt-6">
            <h3 className="text-lg font-medium text-blue-700 mb-3">Všichni uživatelé</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm table-auto">
                <thead>
                  <tr className="text-left text-blue-600">
                    <th className="p-2">Uživatel</th>
                    <th className="p-2">Heslo</th>
                    <th className="p-2">Akce</th>
                  </tr>
                </thead>
                <tbody>
                  {(() => {
                    const usersRaw = localStorage.getItem(STORAGE_USERS_KEY);
                    const users = usersRaw ? JSON.parse(usersRaw) : {};
                    const entries = Object.entries(users);
                    if (entries.length === 0) {
                      return (
                        <tr>
                          <td colSpan={3} className="p-4 text-center text-gray-500">
                            Žádní uživatelé
                          </td>
                        </tr>
                      );
                    }
                    return entries.map(([user, pass]) => (
                      <tr key={user} className="border-t">
                        <td className="p-2">{user}</td>
                        <td className="p-2">{pass}</td>
                        <td className="p-2">
                          {user !== "admin" && (
                            <button
                              onClick={() => deleteUser(user)}
                              className="px-3 py-1 text-sm bg-red-500 text-white rounded-md"
                            >
                              Smazat
                            </button>
                          )}
                        </td>
                      </tr>
                    ));
                  })()}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
