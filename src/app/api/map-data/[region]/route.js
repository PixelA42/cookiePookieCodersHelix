import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(_request, { params }) {
    const { region } = params;
    const supabase = await createClient();

    // This is where you'd usually query a database.
    // For now, let's use some dummy data.
    const { data, error } = await supabase
        .from("countries")
        .select("*")
        .eq("name", region)
        .single();

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
}
