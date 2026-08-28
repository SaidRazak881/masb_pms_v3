export type Database = {
  public: {
    Tables: {
      profiles: { Row: { id:string; full_name:string; email:string; role:"super_admin"|"admin"|"manager"|"pic"|"viewer"; pic_display_name:string|null; is_active:boolean; must_reset_password:boolean }, Insert: Partial<Database["public"]["Tables"]["profiles"]["Row"]> & { id:string; full_name:string; email:string }, Update: Partial<Database["public"]["Tables"]["profiles"]["Row"]> };
      companies: { Row:{id:string; canonical_name:string; aliases:string[]; client_category:string|null; sector:string|null}; Insert:{canonical_name:string; aliases?:string[]; client_category?:string|null; sector?:string|null}; Update:Partial<Database["public"]["Tables"]["companies"]["Insert"]> };
      programs: { Row:{id:string; program_code:string; title:string; company_id:string; category:string|null; current_stage:string; forecast_value:number|null; probability:number|null; weighted_value:number|null; pic_user_id:string|null; sector:string|null; lead_date:string|null}; Insert:Partial<Database["public"]["Tables"]["programs"]["Row"]> & {program_code:string; title:string; company_id:string}; Update:Partial<Database["public"]["Tables"]["programs"]["Insert"]> };
      invoices: { Row:{id:string; program_id:string; invoice_no:string; invoice_date:string|null; invoice_value_excl_sst:number; sst_amount:number; total_value:number; payment_status:string; due_date:string|null; days_outstanding:number|null; pic:string|null}; Insert:Partial<Database["public"]["Tables"]["invoices"]["Row"]> & {program_id:string; invoice_no:string}; Update:Partial<Database["public"]["Tables"]["invoices"]["Insert"]> };
      quotations: { Row:{id:string; program_id:string; quotation_no_raw:string; final_price:number|null; status:string; quotation_date:string|null; prepared_by:string|null}; Insert:Partial<Database["public"]["Tables"]["quotations"]["Row"]> & {program_id:string; quotation_no_raw:string}; Update:Partial<Database["public"]["Tables"]["quotations"]["Insert"]> };
    };
    Views: { vw_action_required:{ Row:{category:string;record_id:string;program_code:string|null;company_name:string|null;amount:number|null;days_outstanding:number|null;pic:string|null;priority:string} }; vw_r1_income_statement:{Row:Record<string,unknown>}; vw_r2_overall_report:{Row:Record<string,unknown>}; vw_r3_sales_funnel:{Row:Record<string,unknown>} };
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  }
};
