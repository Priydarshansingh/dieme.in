'use client';

import React from 'react';
import Link from 'next/link';
import { ShieldAlert, ExternalLink, ArrowRight } from 'lucide-react';

export default function WebGodPanelRedirect() {
  const backendGodPanelUrl = process.env.NEXT_PUBLIC_BACKEND_URL
    ? `${process.env.NEXT_PUBLIC_BACKEND_URL}/godpanel`
    : 'http://localhost:3001/godpanel';

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-slate-950 text-slate-100">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl backdrop-blur-xl text-center space-y-6">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 shadow-xl shadow-cyan-600/20">
          <ShieldAlert className="h-9 w-9 text-white" />
        </div>

        <div>
          <span className="rounded-full bg-red-950/80 border border-red-500/40 px-3 py-1 text-xs font-semibold text-red-400">
            Security Isolation Active
          </span>
          <h2 className="mt-3 text-2xl font-bold tracking-tight text-white">
            God Panel Relocated to Backend
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            In compliance with our zero-trust architecture, the administrative God Panel is isolated on the dedicated backend service to prevent client-side credential exposure.
          </p>
        </div>

        <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-4 text-xs text-slate-400 text-left space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Dedicated Backend:</span>
            <span className="font-mono text-cyan-400">digicast-backend</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">RBAC Enforcement:</span>
            <span className="font-mono text-emerald-400">SuperAdmin Isolated</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500">Target Endpoint:</span>
            <span className="font-mono text-slate-300">/godpanel</span>
          </div>
        </div>

        <a
          href={backendGodPanelUrl}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/30 transition"
        >
          <span>Open Dedicated God Panel</span>
          <ExternalLink className="h-4 w-4" />
        </a>

        <div className="pt-2">
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-300 flex items-center justify-center gap-1"
          >
            <span>Return to Creator Dashboard</span>
            <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
