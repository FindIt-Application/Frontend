import { redirect } from "next/navigation";

interface ResultsPageProps {
	params: Promise<{ scanId: string }>;
}

export default async function ResultsPage({ params }: ResultsPageProps) {
	const { scanId } = await params;
	redirect(`/scan/${scanId}`);
}
