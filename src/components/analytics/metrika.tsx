import { headers } from "next/headers";

// ---------------------------------------------------------------------------
// Yandex.Metrika — loaded only when NEXT_PUBLIC_METRIKA_COUNTER_ID is set.
// The inline init script carries the per-request CSP nonce (from middleware);
// under 'strict-dynamic' it may then load mc.yandex.ru/metrika/tag.js.
// Webvisor + click maps enabled — the core behavioural analytics for RU SEO.
// ---------------------------------------------------------------------------
export async function YandexMetrika() {
  const counterId = process.env["NEXT_PUBLIC_METRIKA_COUNTER_ID"];
  if (!counterId) return null;

  const nonce = (await headers()).get("x-nonce") ?? undefined;

  const init = `
(function(m,e,t,r,i,k,a){m[i]=m[i]||function(){(m[i].a=m[i].a||[]).push(arguments)};
m[i].l=1*new Date();
for (var j = 0; j < document.scripts.length; j++) {if (document.scripts[j].src === r) { return; }}
k=e.createElement(t),a=e.getElementsByTagName(t)[0],k.async=1,k.src=r,a.parentNode.insertBefore(k,a)})
(window, document, "script", "https://mc.yandex.ru/metrika/tag.js", "ym");
ym(${JSON.stringify(counterId)}, "init", {clickmap:true,trackLinks:true,accurateTrackBounce:true,webvisor:true});`;

  return (
    <>
      <script nonce={nonce} dangerouslySetInnerHTML={{ __html: init }} />
      <noscript>
        <div>
          <img
            src={`https://mc.yandex.ru/watch/${counterId}`}
            style={{ position: "absolute", left: "-9999px" }}
            alt=""
          />
        </div>
      </noscript>
    </>
  );
}
