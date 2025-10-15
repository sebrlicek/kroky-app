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

export default function KrokyAplikace() {
  const STORAGE_KEY = "krokyData-admin";
  const [loggedIn, setLoggedIn] = useState(false);
  const [showLogin, setShowLogin] = useState(false); // kontrola zobrazení formuláře
  const [usernameInput, setUsernameInput] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [entries, setEntries] = useState([]);
  const [dateInput, setDateInput] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [stepsInput, setStepsInput] = useState(0);
  const [editingId, setEditingId] = useState(null);

  useEffect(() => {
    if (!loggedIn) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) setEntries(JSON.parse(raw));
  }, [loggedIn]);

  useEffect(() => {
    if (!loggedIn) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  }, [entries, loggedIn]);

  function handleLogin(e) {
    e.preventDefault();
    if (usernameInput === "admin" && passwordInput === "admin") {
      setLoggedIn(true);
      setShowLogin(false);
      setUsernameInput("");
      setPasswordInput("");
    } else {
      alert("Špatné uživatelské jméno nebo heslo!");
    }
  }

  function handleLogout() {
    setLoggedIn(false);
    setEntries([]);
  }

  function addOrUpdateEntry(e) {
    e.preventDefault();
    const date = dateInput;
    const steps = Number(stepsInput) || 0;
    if (!date) return;

    if (editingId) {
      setEntries((prev) =>
        prev.map((it) => (it.id === editingId ? { ...it, date, steps } : it))
      );
      setEditingId(null);
    } else {
      setEntries((prev) => {
        const other = prev.filter((p) => p.date !== date);
        const newEntry = { id: Date.now().toString(), date, steps };
        return [...other, newEntry].sort((a, b) => a.date.localeCompare(b.date));
      });
    }
    setStepsInput(0);
  }

  function startEdit(entry) {
    setDateInput(entry.date);
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
    localStorage.removeItem(STORAGE_KEY);
  }

  const totalSteps = entries.reduce((s, e) => s + Number(e.steps || 0), 0);
  const avgSteps = entries.length ? Math.round(totalSteps / entries.length) : 0;
  const chartData = [...entries]
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((e) => ({ date: e.date, kroky: Number(e.steps) }));

  if (!loggedIn && !showLogin) {
    // uvítací obrazovka s tlačítkem Login
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-blue-50">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">Moje aplikace na kroky</h1>
        <button
          onClick={() => setShowLogin(true)}
          className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium"
        >
          Login
        </button>
      </div>
    );
  }

  if (!loggedIn && showLogin) {
    // zobrazení login formuláře
    return (
      <div className="min-h-screen flex items-center justify-center bg-blue-50">
        <form
          onSubmit={handleLogin}
          className="bg-white p-8 rounded-2xl shadow space-y-4 w-80 text-center"
        >
          <h1 className="text-2xl font-bold text-blue-700">Přihlášení</h1>
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
          <div className="flex gap-2">
            <button
              type="submit"
              className="w-full px-4 py-2 rounded-xl bg-blue-600 text-white font-medium"
            >
              Přihlásit se
            </button>
            <button
              type="button"
              onClick={() => setShowLogin(false)}
              className="w-full px-4 py-2 rounded-xl border border-blue-200 text-blue-700"
            >
              Zpět
            </button>
          </div>
        </form>
      </div>
    );
  }

  // hlavní aplikace
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white p-6">
      {/* ... sem vložíš zbytek kódu aplikace s kroky, grafem a tabulkou ... */}
      <div className="max-w-3xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-blue-700">Moje denní kroky</h1>
          <button
            onClick={handleLogout}
            className="px-3 py-1 rounded-xl border border-red-400 text-red-600 text-sm"
          >
            Odhlásit
          </button>
        </header>

        {/* zde zůstává formulář na kroky, graf, tabulka a tlačítka */}
      </div>
    </div>
  );
}
