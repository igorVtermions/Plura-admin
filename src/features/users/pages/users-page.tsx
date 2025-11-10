"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { UserCard, type Plan, type User } from "../components/user-card";
import Image from "@/components/ui/Image";

type FilterKey = Plan | "all";

const USERS_DATA: User[] = [
	{
		id: "1",
		name: "Felipe Oliveira",
		username: "felipe.oliveira",
		bio: "Olá, eu sou o Felipe e estou aqui para fazer novas conexões e aprender!",
		avatarUrl: "https://i.pravatar.cc/150?img=12",
		plan: "subscriber",
	},
	{
		id: "2",
		name: "Sofia Martins",
		username: "sofia.martins",
		bio: "Sofia e está buscando novas amizades e colaborações!",
		avatarUrl: "https://i.pravatar.cc/150?img=38",
		plan: "subscriber",
	},
	{
		id: "3",
		name: "Juliana Ferreira",
		username: "juliana.ferreira",
		bio: "Oi, eu sou a Juliana e quero fazer novas conexões e aprender com vocês!",
		avatarUrl: "https://i.pravatar.cc/150?img=5",
		plan: "subscriber",
	},
	{
		id: "4",
		name: "Ricardo Santos",
		username: "ricardo.santos",
		bio: "Olá, sou Ricardo e estou aqui para expandir minha rede de contatos!",
		avatarUrl: "https://i.pravatar.cc/150?img=21",
		plan: "free",
	},
	{
		id: "5",
		name: "Lucas Almeida",
		username: "lucas.almeida",
		bio: "Oi, eu sou o Lucas e estou buscando novas conexões e colaborações!",
		avatarUrl: "https://i.pravatar.cc/150?img=33",
		plan: "subscriber",
	},
	{
		id: "6",
		name: "Ana Costa",
		username: "ana.costa",
		bio: "Oi, sou Ana e estou aqui para fazer novas amizades e compartilhar experiências!",
		avatarUrl: "https://i.pravatar.cc/150?img=47",
		plan: "free",
	},
	{
		id: "7",
		name: "Carlos Mendes",
		username: "carlos.mendes",
		bio: "Olá, meu nome é Carlos e estou em busca de novas amizades e parcerias!",
		avatarUrl: "https://i.pravatar.cc/150?img=17",
		plan: "free",
	},
	{
		id: "8",
		name: "Fernanda Lima",
		username: "fernanda.lima",
		bio: "Oi, meu nome é Fernanda e adoraria conhecer pessoas novas e trocar ideias!",
		avatarUrl: "https://i.pravatar.cc/150?img=29",
		plan: "subscriber",
	},
	{
		id: "9",
		name: "Patrícia Rocha",
		username: "patricia.rocha",
		bio: "Oi, sou Patrícia e adoro conhecer novas pessoas e compartilhar experiências!",
		avatarUrl: "https://i.pravatar.cc/150?img=55",
		plan: "free",
	},
	{
		id: "10",
		name: "Mariana Souza",
		username: "mariana.souza",
		bio: "Mariana aqui! Vamos aprender juntos e construir conexões positivas.",
		avatarUrl: "https://i.pravatar.cc/150?img=41",
		plan: "subscriber",
	},
	{
		id: "11",
		name: "Gabriel Lima",
		username: "gabriel.lima",
		bio: "Gabriel na área! Buscando mentores e compartilhando conhecimento.",
		avatarUrl: "https://i.pravatar.cc/150?img=28",
		plan: "subscriber",
	},
	{
		id: "12",
		name: "Bianca Nunes",
		username: "bianca.nunes",
		bio: "Bianca aqui! Quero fazer parte de novas comunidades e colaborar.",
		avatarUrl: "https://i.pravatar.cc/150?img=64",
		plan: "free",
	},
];

const TABS: Array<{ key: FilterKey; label: string }> = [
	{ key: "all", label: "Todos" },
	{ key: "subscriber", label: "Assinantes" },
	{ key: "free", label: "Gratuitos" },
	{ key: "banned", label: "Banidos" },
];

const PLAN_META: Record<
	Plan,
	{
		cardGradient: string;
		cardShadow: string;
		titleColor: string;
		subtitleColor: string;
		descriptionColor: string;
		iconColor: string;
		actionBg: string;
		actionBorder: string;
		actionShadow: string;
		dividerColor: string;
		buttonBg: string;
		buttonText: string;
		buttonShadow: string;
		buttonBorder: string;
		avatarBorder: string;
		avatarShadow: string;
	}
> = {
	subscriber: {
		cardGradient: "linear-gradient(180deg, #D8CCFF 0%, #9E88FF 100%)",
		cardShadow: "0px 22px 38px rgba(132, 112, 234, 0.28)",
		titleColor: "#241B55",
		subtitleColor: "#3F3070",
		descriptionColor: "#34245F",
		iconColor: "#2D205F",
		actionBg:
			"linear-gradient(135deg, rgba(255,255,255,0.75) 0%, rgba(255,255,255,0.4) 100%)",
		actionBorder: "rgba(255, 255, 255, 0.65)",
		actionShadow: "0px 12px 24px rgba(121, 102, 230, 0.25)",
		dividerColor: "rgba(255, 255, 255, 0.58)",
		buttonBg: "linear-gradient(180deg, #8265FF 0%, #6C52F4 100%)",
		buttonText: "#FFFFFF",
		buttonShadow: "0px 16px 28px rgba(111, 90, 230, 0.32)",
		buttonBorder: "rgba(255, 255, 255, 0.62)",
		avatarBorder: "#F5F0FF",
		avatarShadow: "0px 14px 26px rgba(127, 105, 235, 0.32)",
	},
	free: {
		cardGradient: "linear-gradient(180deg, #E6EEF9 0%, #B7C6DB 100%)",
		cardShadow: "0px 22px 38px rgba(125, 146, 183, 0.24)",
		titleColor: "#1E2C46",
		subtitleColor: "#3C4E69",
		descriptionColor: "#2A3853",
		iconColor: "#1E2C46",
		actionBg:
			"linear-gradient(135deg, rgba(255,255,255,0.78) 0%, rgba(255,255,255,0.46) 100%)",
		actionBorder: "rgba(255, 255, 255, 0.58)",
		actionShadow: "0px 12px 24px rgba(115, 135, 166, 0.22)",
		dividerColor: "rgba(255, 255, 255, 0.6)",
		buttonBg: "linear-gradient(180deg, #7D8BA6 0%, #687792 100%)",
		buttonText: "#FFFFFF",
		buttonShadow: "0px 16px 28px rgba(102, 121, 149, 0.25)",
		buttonBorder: "rgba(255, 255, 255, 0.55)",
		avatarBorder: "#FFFFFF",
		avatarShadow: "0px 14px 24px rgba(118, 138, 170, 0.23)",
	},
	banned: {
		cardGradient: "linear-gradient(180deg, #FCDDDD 0%, #F19292 100%)",
		cardShadow: "0px 22px 38px rgba(205, 110, 110, 0.26)",
		titleColor: "#661E1E",
		subtitleColor: "#8B2F2F",
		descriptionColor: "#5C1515",
		iconColor: "#661E1E",
		actionBg:
			"linear-gradient(135deg, rgba(255,255,255,0.72) 0%, rgba(255,255,255,0.45) 100%)",
		actionBorder: "rgba(255, 255, 255, 0.66)",
		actionShadow: "0px 12px 24px rgba(206, 107, 107, 0.22)",
		dividerColor: "rgba(255, 255, 255, 0.6)",
		buttonBg: "linear-gradient(180deg, #D85C5C 0%, #C44646 100%)",
		buttonText: "#FFFFFF",
		buttonShadow: "0px 16px 28px rgba(197, 77, 77, 0.28)",
		buttonBorder: "rgba(255, 255, 255, 0.6)",
		avatarBorder: "#FFEAEA",
		avatarShadow: "0px 14px 24px rgba(201, 96, 96, 0.28)",
	},
};

export default function UsersPage() {
	const [filter, setFilter] = useState<FilterKey>("all");
	const [search, setSearch] = useState("");
	const [page, setPage] = useState(1);

	const counts = useMemo(
		() =>
			USERS_DATA.reduce(
				(acc, user) => {
					acc.all += 1;
					acc[user.plan] += 1;
					return acc;
				},
				{ all: 0, subscriber: 0, free: 0, banned: 0 }
			),
		[]
	);

	const filteredUsers = useMemo(() => {
		const term = search.trim().toLowerCase();
		return USERS_DATA.filter((user) => {
			const matchesSearch =
				term.length === 0 ||
				user.name.toLowerCase().includes(term) ||
				user.username.toLowerCase().includes(term) ||
				user.bio.toLowerCase().includes(term);
			const matchesFilter = filter === "all" ? true : user.plan === filter;
			return matchesSearch && matchesFilter;
		});
	}, [filter, search]);

	const perPage = 9;
	const totalPages = Math.max(1, Math.ceil(filteredUsers.length / perPage));
	const paginatedUsers = filteredUsers.slice(
		(page - 1) * perPage,
		page * perPage
	);

	useEffect(() => {
		setPage(1);
	}, [filter, search]);

	return (
		<main className="min-h-screen bg-white">
			<div className="mx-auto w-full max-w-6xl px-6 py-10">
				<header className="mb-8 space-y-6">
					<div className="space-y-1">
						<h1 className="text-[28px] font-semibold text-[#191F33]">
							Usuários
						</h1>
						<p className="text-sm text-[#5A6480]">Ver todos usuários</p>
					</div>

					<div className="flex flex-wrap items-center gap-4">
						<div className="relative flex-1 min-w-[220px] max-w-sm">
							<Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#5A6480]" />
							<Input
								value={search}
								onChange={(event) =>
									setSearch(event.currentTarget.value)
								}
								placeholder="Pesquisar por usuário"
								className="h-11 rounded-xl border-[#D0D9F1] bg-white pl-11 text-sm text-[#191F33] placeholder:text-[#8A94AB]"
							/>
						</div>

						<select
							value={filter}
							onChange={(event) =>
								setFilter(event.currentTarget.value as FilterKey)
							}
							className="h-11 rounded-xl border border-[#D0D9F1] bg-white px-4 text-sm text-[#191F33] focus:outline-none focus:ring-2 focus:ring-[#977CEC]"
						>
							{TABS.map((tab) => (
								<option key={tab.key} value={tab.key}>
									Filtrar por {tab.label.toLowerCase()}
								</option>
							))}
						</select>

						<div
							className="px-4 py-2 text-sm font-normal"
							style={{ color: "#808DB2" }}
						>
							{filteredUsers.length} usuários
						</div>
					</div>

					<nav className="mt-4 flex w-full overflow-hidden rounded-full border border-[#D5DDF5] bg-white">
						{TABS.map((tab, index) => {
							const active = filter === tab.key;
							return (
								<button
									key={tab.key}
									type="button"
									onClick={() => setFilter(tab.key)}
									aria-label={`${tab.label} (${counts[tab.key]} usuários)`}
									aria-pressed={active}
									className={cn(
										"flex-1 px-6 py-2 text-sm font-medium text-[#5A6480] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#977CEC] focus-visible:ring-offset-0",
										index === 0 && "rounded-l-full",
										index === TABS.length - 1 && "rounded-r-full",
										active
											? "bg-[#EEF2FF] text-[#2E3A63]"
											: "bg-white hover:bg-[#F7F9FF]"
									)}
								>
									{tab.label}
								</button>
							);
						})}
					</nav>
				</header>

				<section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
					{paginatedUsers.map((user) => (
						<UserCard key={user.id} user={user} />
					))}
					{paginatedUsers.length === 0 && (
						<div className="col-span-full rounded-2xl border border-dashed border-[#D0D9F1] p-10 text-center text-[#5A6480]">
							Nenhum usuário encontrado com os filtros atuais.
						</div>
					)}
				</section>

				<Pagination
					page={page}
					totalPages={totalPages}
					onPageChange={setPage}
				/>
			</div>
		</main>
	);
}

function Pagination({
	page,
	totalPages,
	onPageChange,
}: {
	page: number;
	totalPages: number;
	onPageChange: (p: number) => void;
}) {
	const selectedBtnRef = React.useRef<HTMLButtonElement | null>(null);

	useEffect(() => {
		selectedBtnRef.current?.scrollIntoView({
			behavior: "smooth",
			inline: "center",
			block: "nearest",
		});
	}, [page, totalPages]);

	if (totalPages <= 1) return null;

	const maxVisible = 5;
	const half = Math.floor(maxVisible / 2);
	const start = Math.max(
		1,
		Math.min(page - half, Math.max(1, totalPages - maxVisible + 1))
	);
	const end = Math.min(totalPages, start + maxVisible - 1);
	const pages = Array.from({ length: end - start + 1 }, (_, idx) => start + idx);

	const goPage = (target: number) =>
		onPageChange(Math.max(1, Math.min(totalPages, target)));
	const prevDisabled = page === 1;
	const nextDisabled = page === totalPages;

	return (
		<div className="mt-10 flex items-center justify-center">
			<div className="flex items-center">
				<button
					type="button"
					aria-label="Página anterior"
					onClick={() => goPage(page - 1)}
					disabled={prevDisabled}
					className="flex h-10 items-center justify-center rounded-md border bg-white px-3 py-2 md:h-12"
					style={{
						borderColor: "#D0D9F1",
						color: prevDisabled ? "#7682A5" : "#191F33",
						opacity: prevDisabled ? 0.5 : 1,
					}}
				>
					<Image
						src="/Arrow.svg"
						alt="Anterior"
						width={13}
						height={13}
						className="object-contain"
					/>
				</button>

				<div
					className="users-pagination-scroll mx-4 flex items-center gap-2 overflow-x-auto md:mx-6"
					style={{ scrollBehavior: "smooth" }}
				>
					{pages.map((p) => (
						<button
							key={p}
							ref={p === page ? selectedBtnRef : null}
							type="button"
							onClick={() => goPage(p)}
							className="flex h-10 w-10 items-center justify-center rounded-md border bg-white text-sm font-medium md:h-12 md:w-12"
							style={{
								borderColor: "#D0D9F1",
								color: p === page ? "#191F33" : "#7682A5",
								minWidth: 44,
							}}
						>
							{p}
						</button>
					))}
				</div>

				<button
					type="button"
					aria-label="Próxima página"
					onClick={() => goPage(page + 1)}
					disabled={nextDisabled}
					className="flex h-10 items-center justify-center rounded-md border bg-white px-3 py-2 md:h-12"
					style={{
						borderColor: "#D0D9F1",
						color: nextDisabled ? "#7682A5" : "#191F33",
						opacity: nextDisabled ? 0.5 : 1,
					}}
				>
					<Image
						src="/Arrow.svg"
						alt="Próxima"
						width={13}
						height={13}
						className="object-contain rotate-180"
					/>
				</button>
			</div>

			<style>{`
        .users-pagination-scroll { -ms-overflow-style: none; scrollbar-width: none; }
        .users-pagination-scroll::-webkit-scrollbar { display: none; }
      `}</style>
		</div>
	);
}