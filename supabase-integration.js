/**
 * Supabase Agent Skills Integration
 * Hili faili linaunganisha ujuzi wa Supabase uliouongeza kupitia npx.
 */

require("dotenv").config();

let toolset;
try {
    const { ComposioToolSet } = require("composio-core");
    toolset = new ComposioToolSet();
} catch (e) {
    console.warn("⚠️ Tahadhari: 'composio-core' haijasakinishwa bado. Tafadhali endesha 'npm install --legacy-peer-deps'");
}

/**
 * Inaruhusu agent kutumia ujuzi wa Supabase uliowekwa.
 * 
 * Maelezo ya Database (Project ID: dfevchqrutwfmewxpmhr):
 * - Host: aws-0-eu-west-1.pooler.supabase.com
 * - Port: 5432
 * - Database: postgres
 * - User: postgres.dfevchqrutwfmewxpmhr
 * 
 * Hakikisha SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, na DATABASE_URL 
 * zimefafanuliwa kwenye faili lako la .env.
 */
async function getSupabaseTools() {
    try {
        if (!toolset) {
            console.error("❌ ComposioToolSet haijapatikana.");
            return [];
        }

        const tools = await toolset.getTools({
            apps: ["supabase"]
        });
        
        console.log("✅ Supabase agent skills zimeunganishwa kwa mradi: dfevchqrutwfmewxpmhr");
        return tools;
    } catch (error) {
        console.error("❌ Imeshindikana kupata Supabase agent tools:", error);
        return [];
    }
}

// Mfano wa jinsi ya kutumia agent kufanya query
async function executeAgentTask(agent, prompt) {
    const tools = await getSupabaseTools();
    
    if (tools.length === 0) {
        throw new Error("Hakuna 'tools' za Supabase zilizopatikana. Angalia usakinishaji wako.");
    }
    
    return await agent.execute({
        input: prompt,
        tools: tools
    });
}

module.exports = {
    getSupabaseTools,
    executeAgentTask
};