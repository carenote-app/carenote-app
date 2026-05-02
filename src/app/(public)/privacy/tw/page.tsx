import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "個人資料保護告知 | Privacy Notice (Taiwan) - Kinroster",
  description:
    "Kinroster 台灣使用者個人資料保護告知。Taiwan PDPA notice for users in Taiwan.",
};

// Taiwan-specific PDPA (個人資料保護法) notice. Surfaced at signup for orgs
// with regulatory_region='pdpa_tw' and once a year for renewal. The notice
// covers (a) cross-border-transfer disclosure to Anthropic, OpenAI, Vapi,
// ElevenLabs, Deepgram, Resend, Vercel, Stripe, and (b) the consent
// statement saved to consent_records.
//
// TODO(human-action): Taiwan privacy attorney review. The text below is a
// good-faith starting point modeled on PDPA Article 8 (notice content) and
// Article 21 (cross-border transfer); a local lawyer should confirm
// language and scope before pdpa_tw orgs go live with real PHI.
export default function TaiwanPrivacyNoticePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          個人資料保護告知
        </h1>
        <p className="mt-1 text-base text-muted-foreground">
          Privacy Notice for Taiwan Users
        </p>
        <p className="mt-2 text-sm text-muted-foreground">
          最後更新 / Last updated: May 2026
        </p>
      </div>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          一、蒐集機關 / Collecting party
        </h2>
        <p className="leading-relaxed text-muted-foreground">
          Kinroster, Inc.(以下簡稱「本公司」)為個人資料保護法所稱之蒐集者。
          Kinroster, Inc. is the data controller for purposes of the Taiwan
          Personal Data Protection Act (個人資料保護法 / PDPA).
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          二、蒐集目的與類別 / Purposes and categories
        </h2>
        <p className="leading-relaxed text-muted-foreground">
          本公司基於下列目的蒐集、處理及利用您與您所照顧住民之個人資料,
          類別包含住民識別資料、健康狀況、照護紀錄、家庭聯絡資訊、
          照護人員身分驗證與通訊資料:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>
            提供 AI 輔助之照護紀錄文件化服務 (AI-assisted care documentation).
          </li>
          <li>
            產生供醫師審閱之臨床摘要與供家屬審閱之家庭更新通知
            (Clinical summaries for treating physicians and family updates).
          </li>
          <li>
            符合長期照顧服務法等相關法規之文件保存義務
            (Compliance with the Long-term Care Services Act and related
            documentation duties).
          </li>
          <li>
            服務品質監測、客戶支援與帳務管理 (Service quality monitoring,
            customer support, billing).
          </li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          三、跨境傳輸告知 / Cross-border transfer disclosure
        </h2>
        <p className="leading-relaxed text-muted-foreground">
          為提供本服務,您的個人資料會傳輸至下列位於台灣境外之第三方處理者。
          Personal data is transferred to the following third-party processors
          located outside Taiwan in order to provide the Service:
        </p>
        <ul className="list-disc space-y-2 pl-6 text-muted-foreground">
          <li>
            <span className="font-medium text-foreground">Anthropic, PBC</span>{" "}
            (United States) — large language model inference (Claude API).
            Data retained 30 days; not used for model training.
          </li>
          <li>
            <span className="font-medium text-foreground">OpenAI, OpCo LLC</span>{" "}
            (United States) — speech-to-text (Whisper API). Audio is not
            stored beyond the request.
          </li>
          <li>
            <span className="font-medium text-foreground">Vapi, Inc.</span>{" "}
            (United States) — live voice-call orchestration.
          </li>
          <li>
            <span className="font-medium text-foreground">ElevenLabs, Inc.</span>{" "}
            (United States) — multilingual text-to-speech for the voice
            assistant.
          </li>
          <li>
            <span className="font-medium text-foreground">
              Deepgram Inc.
            </span>{" "}
            (United States) — multilingual speech recognition for the voice
            assistant.
          </li>
          <li>
            <span className="font-medium text-foreground">Resend, Inc.</span>{" "}
            (United States) — transactional email delivery for family updates.
          </li>
          <li>
            <span className="font-medium text-foreground">Vercel, Inc.</span>{" "}
            (Global edge network) — application hosting.
          </li>
          <li>
            <span className="font-medium text-foreground">Stripe, Inc.</span>{" "}
            (United States) — billing (no clinical data transmitted).
          </li>
          <li>
            <span className="font-medium text-foreground">
              Supabase / AWS (Asia-Pacific Tokyo)
            </span>{" "}
            — primary database storage in ap-northeast-1.
          </li>
        </ul>
        <p className="leading-relaxed text-muted-foreground">
          本公司已要求上述處理者履行與本公司所承擔之保密與安全義務相當之要求,
          並於必要時簽訂處理協議。 Each processor is bound by contractual
          obligations equivalent to those Kinroster owes you.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          四、資料當事人權利 / Data subject rights
        </h2>
        <p className="leading-relaxed text-muted-foreground">
          您依個人資料保護法享有下列權利:查詢或請求閱覽、請求製給複製本、
          請求補充或更正、請求停止蒐集處理或利用、請求刪除。
          Under the PDPA you have the right to inquire about, view, copy,
          correct, suspend processing of, or delete your personal data. To
          exercise these rights, contact privacy@kinroster.com.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          五、保存期間 / Retention
        </h2>
        <p className="leading-relaxed text-muted-foreground">
          照護紀錄依長期照顧服務法之要求保存,稽核紀錄保存六年。
          Care records are retained per the Long-term Care Services Act;
          audit-event records are retained six years.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          六、資料外洩通報 / Breach notification
        </h2>
        <p className="leading-relaxed text-muted-foreground">
          發生個人資料外洩事件時,本公司將於知悉後 72 小時內通報衛生福利部
          並依規定通知受影響當事人。 In the event of a personal data breach,
          Kinroster will notify the Ministry of Health and Welfare (衛生福利部)
          within 72 hours of discovery and notify affected data subjects as
          required.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-semibold text-foreground">
          七、同意 / Consent
        </h2>
        <p className="leading-relaxed text-muted-foreground">
          使用本服務即表示您已閱讀並同意本告知之內容。 By using the Service you
          acknowledge that you have read and understood this notice and consent
          to the collection, processing, and cross-border transfer of personal
          data described above.
        </p>
      </section>
    </div>
  );
}
