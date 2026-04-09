/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { signOutAction } from "@/components/layout/sign-out-action";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { OrganizationBranding, Profile } from "@/lib/types";

export function DashboardShell({
  profile,
  organization,
  children
}: {
  profile: Profile;
  organization: OrganizationBranding;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen px-4 py-4 md:px-6 md:py-6">
      <div className="mx-auto flex max-w-7xl flex-col gap-4">
        <header className="rounded-[28px] bg-white/85 p-4 shadow-panel md:p-5">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              {organization.resolved_logo_url ? (
                <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl bg-sand/70">
                  <img
                    src={organization.resolved_logo_url}
                    alt={`Logo ${organization.organization_name}`}
                    className="h-12 w-12 object-contain"
                  />
                </div>
              ) : null}
              <div>
                <p className="text-xs uppercase tracking-[0.3em] text-ink/45">SST Présentiel</p>
                <h1 className="mt-1 text-2xl font-bold">Gestion de formation</h1>
                <p className="mt-1 text-sm text-ink/55">{organization.organization_name}</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <nav className="flex flex-wrap gap-2">
                <Link className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-sand" href="/dashboard">
                  Tableau de bord
                </Link>
                <Link className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-sand" href="/sessions">
                  Sessions
                </Link>
                <Link className="rounded-full px-4 py-2 text-sm font-semibold hover:bg-sand" href="/companies">
                  Sociétés
                </Link>
              </nav>
              <span className="text-sm text-ink/60">{profile.full_name}</span>
              <Badge tone="success">Connecté</Badge>
              <form action={signOutAction}>
                <Button type="submit" variant="secondary">
                  Déconnexion
                </Button>
              </form>
            </div>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
