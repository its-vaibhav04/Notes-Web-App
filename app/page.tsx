"use client";

import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, FormEvent } from "react";
import type { Note } from "@prisma/client";
import Loader from "./_components/Loader";

export default function HomePage() {
  const sessionData = useSession();
  const router = useRouter();

  const [notes, setNotes] = useState<Note[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(true);

  useEffect(() => {
    if (sessionData.status === "authenticated") {
      fetch("/api/notes")
        .then((res) => res.json())
        .then((data) => {
          setNotes(data);
          setLoadingNotes(false);
        });
    }
    if (sessionData.status === "unauthenticated") {
      router.push("/login");
    }
  }, [sessionData.status, router]);

  const handleCreateNote = async (event: FormEvent) => {
    event.preventDefault();
    setError("");

    const res = await fetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content }),
    });

    if (res.ok) {
      const newNote = await res.json();
      setNotes([newNote, ...notes]);
      setTitle("");
      setContent("");
    } else {
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        const err = await res.json();
        setError(err.error || "Failed to create note.");
      } else {
        setError(`Error: ${res.status} ${res.statusText}`);
      }
    }
  };

  const handleDeleteNote = async (noteId: string) => {
    if (!confirm("Are you sure you want to delete this note?")) {
      return;
    }

    const res = await fetch(`/api/notes/${noteId}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setNotes(notes.filter((note) => note.id !== noteId));
    } else {
      alert("Failed to delete note.");
    }
  };

  const handleUpgrade = async () => {
    if (!sessionData.data?.user?.tenantSlug) return;

    const res = await fetch(
      `/api/tenants/${sessionData.data.user.tenantSlug}/upgrade`,
      {
        method: "POST",
      }
    );
    if (res.ok) {
      alert("Upgrade successful! You now have unlimited notes.");
      setError("");
      await sessionData.update();
      router.refresh();
    } else {
      alert("Upgrade failed.");
    }
  };

  if (sessionData.status === "loading" || loadingNotes) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50">
        <div className="p-8 bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-teal-100">
          <Loader />
        </div>
      </div>
    );
  }

  if (sessionData.status === "authenticated") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-teal-50 to-cyan-50">
        {/* Navigation */}
        <nav className="bg-slate-900/95 backdrop-blur-sm shadow-2xl border-b border-slate-800">
          <div className="px-6 mx-auto max-w-7xl sm:px-8 lg:px-10">
            <div className="flex justify-between h-16">
              <div className="flex items-center">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">✍🏼</span>
                  </div>
                  <span className="text-xl font-bold text-white">Notes</span>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="hidden sm:flex items-center space-x-2">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                  <span className="text-sm text-slate-300">
                    {sessionData.data?.user?.email}
                  </span>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: "/login" })}
                  className="px-4 py-2 text-sm font-medium text-white bg-teal-600 hover:bg-teal-700 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-teal-500/25"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </nav>

        <main className="p-6 mx-auto max-w-7xl sm:p-8">
          {/* Upgrade Banner */}
          {sessionData.data.user.role === "ADMIN" &&
            error.includes("Upgrade to Pro") && (
              <div className="p-6 mb-8 text-center bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl shadow-lg">
                <div className="flex items-center justify-center space-x-2 mb-3">
                  <div className="w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">⚡</span>
                  </div>
                  <p className="text-amber-800 font-medium">{error}</p>
                </div>
                <button
                  onClick={handleUpgrade}
                  className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-all duration-200 hover:shadow-lg hover:shadow-emerald-500/25 transform hover:scale-105"
                >
                  Upgrade to Pro
                </button>
              </div>
            )}

          {/* Create Note Form */}
          <div className="p-8 mb-8 bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-xl shadow-slate-200/20">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-6 h-6 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg"></div>
              <h2 className="text-2xl font-bold text-slate-800">
                Create a New Note
              </h2>
            </div>
            <form onSubmit={handleCreateNote} className="space-y-6">
              <div>
                <input
                  type="text"
                  placeholder="Note Title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-4 py-3 text-slate-800 bg-slate-50/80 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 hover:bg-slate-50"
                />
              </div>
              <div>
                <textarea
                  placeholder="Note Content (Optional)"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  className="w-full px-4 py-3 text-slate-800 bg-slate-50/80 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200 hover:bg-slate-50 resize-none"
                />
              </div>
              {error && (
                <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs">!</span>
                  </div>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}
              <button
                type="submit"
                className="px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-teal-600 to-cyan-600 rounded-xl hover:from-teal-700 hover:to-cyan-700 transition-all duration-200 hover:shadow-lg hover:shadow-teal-500/25 transform hover:scale-105"
              >
                Save Note
              </button>
            </form>
          </div>

          {/* Notes Section */}
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-6 h-6 bg-gradient-to-br from-slate-700 to-slate-900 rounded-lg"></div>
            <h2 className="text-2xl font-bold text-slate-800">Your Notes</h2>
            <div className="flex-1 h-px bg-gradient-to-r from-slate-300 to-transparent"></div>
            <span className="text-sm text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              {notes.length} {notes.length === 1 ? "note" : "notes"}
            </span>
          </div>

          <div className="space-y-4">
            {notes.length > 0 ? (
              notes.map((note, index) => (
                <div
                  key={note.id}
                  className="group p-6 bg-white/90 backdrop-blur-sm border border-slate-200/50 rounded-2xl shadow-lg shadow-slate-200/20 hover:shadow-xl hover:shadow-slate-300/25 transition-all duration-300 hover:border-teal-300/50"
                  style={{
                    animationDelay: `${index * 100}ms`,
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-2 h-2 bg-teal-500 rounded-full"></div>
                        <h3 className="text-lg font-semibold text-slate-800 truncate">
                          {note.title}
                        </h3>
                      </div>
                      {note.content && (
                        <p className="text-slate-600 leading-relaxed">
                          {note.content}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDeleteNote(note.id)}
                      className="ml-4 px-4 py-2 text-sm font-medium text-white bg-slate-600 hover:bg-red-600 rounded-lg transition-all duration-200 hover:shadow-lg hover:shadow-red-500/25 group-hover:bg-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gradient-to-br from-slate-200 to-slate-300 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <span className="text-slate-500 text-2xl">📝</span>
                </div>
                <p className="text-slate-500 text-lg">
                  You haven&apos;t created any notes yet.
                </p>
                <p className="text-slate-400 text-sm mt-1">
                  Start by creating your first note above!
                </p>
              </div>
            )}
          </div>
        </main>
      </div>
    );
  }

  return null;
}
