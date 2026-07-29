"use client";

import { KeyRound, Globe, AlertTriangle } from "lucide-react";

const statusColors: Record<string, string> = {
  requested: "text-yellow-400 bg-yellow-500/10 border-yellow-500/20",
  verified: "text-blue-400 bg-blue-500/10 border-blue-500/20",
  completed: "text-green-400 bg-green-500/10 border-green-500/20",
  failed: "text-red-400 bg-red-500/10 border-red-500/20",
  expired: "text-red-400 bg-red-500/10 border-red-500/20",
};

export default function SecurityTab({
  passwordResets,
  adminKey,
}: {
  passwordResets: any[];
  adminKey: string;
}) {
  const completed = passwordResets.filter((r) => r.status === "completed").length;
  const pending = passwordResets.filter((r) => r.status === "requested").length;
  const verified = passwordResets.filter((r) => r.status === "verified").length;
  const failed = passwordResets.filter(
    (r) => r.status === "failed" || r.status === "expired"
  ).length;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-serif text-white">Security</h2>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-green-500/5 border border-green-500/20 rounded-2xl p-5">
          <p className="text-2xl font-display font-bold text-green-400">{completed}</p>
          <p className="text-xs text-dark-400 mt-1">Completed</p>
        </div>
        <div className="bg-yellow-500/5 border border-yellow-500/20 rounded-2xl p-5">
          <p className="text-2xl font-display font-bold text-yellow-400">{pending}</p>
          <p className="text-xs text-dark-400 mt-1">Pending</p>
        </div>
        <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5">
          <p className="text-2xl font-display font-bold text-blue-400">{verified}</p>
          <p className="text-xs text-dark-400 mt-1">Verified</p>
        </div>
        <div className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5">
          <p className="text-2xl font-display font-bold text-red-400">{failed}</p>
          <p className="text-xs text-dark-400 mt-1">Failed</p>
        </div>
      </div>

      {passwordResets.length === 0 ? (
        <div className="text-center py-16 bg-dark-900/60 border border-dark-800/50 rounded-2xl">
          <KeyRound className="w-12 h-12 text-dark-600 mx-auto mb-3" />
          <p className="text-dark-400 text-sm">No password resets yet</p>
        </div>
      ) : (
        <div className="bg-dark-900/60 border border-dark-800/50 rounded-2xl overflow-hidden">
          <div className="divide-y divide-dark-800/30">
            {passwordResets.map((reset) => (
              <div
                key={reset.id}
                className={`px-6 py-5 hover:bg-dark-800/20 transition-colors`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-medium text-white group-hover:text-gold-400 transition-colors">
                        {reset.user?.name || "Unknown User"}
                      </h3>
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold border capitalize ${
                          statusColors[reset.status] || ""
                        }`}
                      >
                        {reset.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-dark-400">
                      {reset.user?.email && <span>{reset.user.email}</span>}
                      {reset.user?.phone && <span>{reset.user.phone}</span>}
                      {reset.method && (
                        <span className="px-1.5 py-0.5 bg-dark-800/60 border border-dark-700/50 rounded text-[10px] text-dark-300">
                          {reset.method}
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-[10px] text-dark-500 shrink-0">
                    {new Date(reset.requestedAt || reset.createdAt).toLocaleString("en-IN", {
                      day: "numeric",
                      month: "short",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>

                <div className="ml-14 flex items-center gap-4 text-xs text-dark-500 mb-3">
                  {reset.ipAddress && (
                    <div className="flex items-center gap-1.5">
                      <Globe className="w-3 h-3 text-dark-500" />
                      <span className="text-[10px]">{reset.ipAddress}</span>
                    </div>
                  )}
                  {reset.failReason && (
                    <div className="flex items-center gap-1.5">
                      <AlertTriangle className="w-3 h-3 text-red-400" />
                      <span className="text-[10px] text-red-400/80">{reset.failReason}</span>
                    </div>
                  )}
                </div>

                <div className="ml-14 flex items-center gap-0">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-yellow-400" />
                    <span className="text-[10px] text-dark-400">Requested</span>
                  </div>
                  <div className="w-8 h-[1px] bg-dark-700" />
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        reset.status === "verified" ||
                        reset.status === "completed"
                          ? "bg-blue-400"
                          : "bg-dark-700"
                      }`}
                    />
                    <span className="text-[10px] text-dark-400">OTP Verified</span>
                  </div>
                  <div className="w-8 h-[1px] bg-dark-700" />
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        reset.status === "completed"
                          ? "bg-green-400"
                          : reset.status === "failed" || reset.status === "expired"
                          ? "bg-red-400"
                          : "bg-dark-700"
                      }`}
                    />
                    <span className="text-[10px] text-dark-400">
                      {reset.status === "failed" || reset.status === "expired"
                        ? "Failed"
                        : "Completed"}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
