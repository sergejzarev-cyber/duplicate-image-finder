import { LEGAL } from '../config';

export function imprintHtml(lang: 'ru' | 'en' | 'de'): string {
  if (lang === 'de') {
    return `
      <h3>Impressum</h3>
      <p><strong>Angaben gemäß § 5 DDG</strong></p>
      <p>
        Sergej Zarev<br/>
        Eggersweide 18<br/>
        22159 Hamburg<br/>
        Deutschland
      </p>
      <p>E-Mail: <a href="mailto:sergej.zarev@gmail.com">sergej.zarev@gmail.com</a></p>
    `;
  }

  if (lang === 'ru') {
    return `
      <h3>Импрессум</h3>
      <p><strong>Сведения согласно § 5 DDG</strong></p>
      <p>
        Sergej Zarev<br/>
        Eggersweide 18<br/>
        22159 Hamburg<br/>
        Deutschland
      </p>
      <p>E-Mail: <a href="mailto:sergej.zarev@gmail.com">sergej.zarev@gmail.com</a></p>
    `;
  }

  return `
    <h3>Imprint</h3>
    <p><strong>Information according to § 5 DDG</strong></p>
    <p>
      Sergej Zarev<br/>
      Eggersweide 18<br/>
      22159 Hamburg<br/>
      Germany
    </p>
    <p>Email: <a href="mailto:sergej.zarev@gmail.com">sergej.zarev@gmail.com</a></p>
  `;
}

export function privacyHtml(lang: 'ru' | 'en' | 'de'): string {
  // Full DE privacy policy as provided by the site operator
  if (lang === 'de') {
    return `
      <h3>Datenschutzerklärung</h3>
      <p><em>Stand: Oktober 2026</em></p>

      <h3>1. Verantwortlicher</h3>
      <p>Verantwortlicher für die Verarbeitung personenbezogener Daten auf dieser Website ist:</p>
      <p>
        Sergej Zarev<br/>
        Eggersweide 18<br/>
        22159 Hamburg<br/>
        Deutschland
      </p>
      <p>E-Mail: <a href="mailto:sergej.zarev@gmail.com">sergej.zarev@gmail.com</a></p>

      <h3>2. Allgemeine Hinweise</h3>
      <p>Der Schutz Ihrer persönlichen Daten ist uns wichtig.</p>
      <p>Diese Website stellt das Tool DupSweep zur Suche nach identischen und ähnlichen Bildern bereit.</p>
      <p>Ein besonderer Schwerpunkt des Dienstes liegt auf der lokalen Verarbeitung: Die von Ihnen ausgewählten Bilder werden
      <strong>nicht auf unsere Server hochgeladen</strong>. Die Analyse der Bilder erfolgt ausschließlich lokal in Ihrem Browser
      auf Ihrem eigenen Gerät.</p>
      <p>Wir verarbeiten personenbezogene Daten nur, soweit dies für die Bereitstellung der Website, die Bearbeitung von
      Kontaktanfragen oder die von Ihnen ausdrücklich genutzten Funktionen erforderlich ist.</p>

      <h3>3. Aufruf der Website und Hosting</h3>
      <p>Diese Website wird über Vercel bereitgestellt.</p>
      <p>Beim Aufruf der Website können technisch erforderliche Informationen verarbeitet werden, insbesondere:</p>
      <ul>
        <li>IP-Adresse,</li>
        <li>Datum und Uhrzeit des Zugriffs,</li>
        <li>angeforderte Ressourcen bzw. URLs,</li>
        <li>Informationen über Browser und Betriebssystem,</li>
        <li>Geräte- und Verbindungsinformationen,</li>
        <li>technische Diagnose- und Protokolldaten.</li>
      </ul>
      <p>Diese Daten sind erforderlich, um die Website technisch bereitzustellen, die Sicherheit und Stabilität des Dienstes
      zu gewährleisten und Fehler zu erkennen.</p>
      <p>Vercel beschreibt in seiner aktuellen Datenschutzerklärung unter anderem die Verarbeitung von IP-Adressen,
      Informationen über Anfragen, Zeitstempeln, Geräteinformationen und technischen Logdaten.</p>
      <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt in der sicheren, stabilen und
      funktionsfähigen Bereitstellung unserer Website.</p>
      <p>Vercel ist ein Anbieter mit Sitz in den USA. Bei der Nutzung der Infrastruktur können personenbezogene Daten auch
      außerhalb der Europäischen Union verarbeitet werden. Einzelheiten hierzu ergeben sich aus den Datenschutzinformationen
      von Vercel.</p>
      <p><a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Datenschutzerklärung von Vercel</a></p>

      <h3>4. Lokale Bildverarbeitung</h3>
      <p>Die zentrale Funktion von DupSweep ist die Suche nach identischen und ähnlichen Bildern.</p>
      <p>Die von Ihnen ausgewählten Bilddateien werden ausschließlich auf Ihrem eigenen Gerät verarbeitet.</p>
      <p>Wenn Sie einen Ordner oder Bilder auswählen:</p>
      <ul>
        <li>werden die Dateien nicht zu unserem Server hochgeladen;</li>
        <li>werden die Bildinhalte nicht an uns übertragen;</li>
        <li>werden die Bilder nicht von uns gespeichert;</li>
        <li>erfolgt die Analyse lokal durch JavaScript in Ihrem Browser.</li>
      </ul>
      <p>Dies gilt sowohl für die Suche nach identischen Dateien als auch für die Suche nach ähnlichen Bildern.</p>
      <p>Wir haben daher keinen Zugriff auf die von Ihnen zur Analyse ausgewählten Fotos.</p>
      <p><strong>Wichtig:</strong> Für die Bereitstellung des Webangebots selbst ist lediglich eine Verbindung zu unserem
      Hosting-Anbieter Vercel erforderlich. Die Bilddateien sind davon unabhängig und werden nicht als Teil der Bildanalyse
      an unseren Server übertragen.</p>

      <h3>5. Feedback-Formular</h3>
      <p>Auf unserer Website besteht die Möglichkeit, freiwillig Feedback zu senden.</p>
      <p>Dabei können Sie folgende Angaben machen:</p>
      <ul>
        <li>Name (optional),</li>
        <li>E-Mail-Adresse (optional),</li>
        <li>Nachricht (erforderlich).</li>
      </ul>
      <p>Wenn Sie das Feedback-Formular absenden, werden die von Ihnen eingegebenen Daten an Formspree übermittelt und dort
      verarbeitet. Formspree stellt die Übermittlung anschließend für die Bearbeitung durch uns bereit.</p>
      <p>Formspree gibt an, dass über Formulare eingereichte Daten im jeweiligen Formspree-Konto gespeichert werden.</p>
      <p>Die Nutzung des Feedback-Formulars ist freiwillig. Wenn Sie keine Daten an Formspree übermitteln möchten, können Sie
      die auf der Website angebotene Funktion zum Kopieren des Nachrichtentextes verwenden und Ihre Nachricht auf anderem Wege
      übermitteln.</p>
      <p>Rechtsgrundlage für die Verarbeitung der von Ihnen freiwillig übermittelten Daten ist Art. 6 Abs. 1 lit. f DSGVO.
      Unser berechtigtes Interesse besteht darin, Feedback und Anfragen zu erhalten und zu beantworten.</p>
      <p>Bitte übermitteln Sie über das Feedback-Formular keine sensiblen oder besonders geschützten personenbezogenen Daten,
      sofern dies für Ihre Nachricht nicht erforderlich ist.</p>
      <p><a href="https://formspree.io/legal/privacy-policy/" target="_blank" rel="noopener noreferrer">Datenschutzinformationen von Formspree</a></p>

      <h3>6. Speicherdauer von Feedback</h3>
      <p>Die über das Feedback-Formular übermittelten Daten werden nur so lange gespeichert, wie dies für die Bearbeitung und
      Dokumentation der jeweiligen Anfrage erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen.</p>
      <p>Die technische Speicherung der Formulareingaben bei Formspree richtet sich zusätzlich nach den dort geltenden
      Speicherfristen und Bedingungen. Beim kostenlosen Formspree-Tarif wird laut Anbieter ein Submission-Archiv von 30 Tagen
      bereitgestellt.</p>

      <h3>7. Spenden / Unterstützung über PayPal</h3>
      <p>Wenn Sie das Projekt freiwillig unterstützen möchten, können Sie die auf der Website angebotene Donate-Funktion nutzen.</p>
      <p>Beim Anklicken des Donate-Buttons werden Sie direkt zu PayPal weitergeleitet.</p>
      <p>Auf unserer Website werden dabei keine Zahlungsdaten wie Kreditkarten- oder Bankverbindungsdaten erhoben oder verarbeitet.</p>
      <p>Die weitere Verarbeitung personenbezogener Daten erfolgt direkt durch PayPal nach den dort geltenden Datenschutzbestimmungen.</p>
      <p><a href="https://www.paypal.com/de/webapps/mpp/ua/privacy-full" target="_blank" rel="noopener noreferrer">Datenschutzerklärung von PayPal</a></p>
      <p>Bei der Nutzung eines PayPal.Me-Links können bestimmte Profilinformationen des Zahlungsempfängers auf der PayPal.Me-Seite
      sichtbar sein. PayPal weist insbesondere darauf hin, dass dort Name bzw. Firmenname sowie gegebenenfalls Profilfoto/Logo und
      der hinterlegte Ort angezeigt werden können.</p>

      <h3>8. Lokale Speicherung im Browser</h3>
      <p>Die Website kann bestimmte Einstellungen, beispielsweise die von Ihnen ausgewählte Sprache, lokal in Ihrem Browser speichern.</p>
      <p>Hierfür kann insbesondere die Browser-Technologie localStorage verwendet werden.</p>
      <p>Diese Informationen werden nicht an uns übermittelt.</p>
      <p>Soweit für eine solche Speicherung oder den Zugriff auf Informationen auf dem Endgerät eine Einwilligung erforderlich ist,
      wird diese entsprechend eingeholt. Nach § 25 Abs. 2 Nr. 2 TDDDG ist eine Einwilligung nicht erforderlich, wenn der Zugriff
      bzw. die Speicherung unbedingt erforderlich ist, um einen vom Nutzer ausdrücklich gewünschten digitalen Dienst bereitzustellen.</p>

      <h3>9. Keine Analyse- oder Werbetracking-Dienste</h3>
      <p>Auf dieser Website werden nach unserem derzeitigen Stand keine Werbenetzwerke und keine Dienste zur Erstellung von
      nutzerbezogenen Werbeprofilen eingesetzt.</p>
      <p>Es werden insbesondere keine Bilder zu Analyse- oder Werbezwecken an Dritte übertragen.</p>

      <h3>10. Ihre Rechte</h3>
      <p>Sie haben nach Maßgabe der gesetzlichen Voraussetzungen insbesondere folgende Rechte:</p>
      <ul>
        <li>Recht auf Auskunft über Ihre personenbezogenen Daten (Art. 15 DSGVO),</li>
        <li>Recht auf Berichtigung unrichtiger Daten (Art. 16 DSGVO),</li>
        <li>Recht auf Löschung (Art. 17 DSGVO),</li>
        <li>Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO),</li>
        <li>Recht auf Datenübertragbarkeit (Art. 20 DSGVO),</li>
        <li>Recht auf Widerspruch gegen bestimmte Verarbeitungen (Art. 21 DSGVO).</li>
      </ul>
      <p>Wenn die Verarbeitung auf Art. 6 Abs. 1 lit. f DSGVO beruht, können Sie aus Gründen, die sich aus Ihrer besonderen
      Situation ergeben, Widerspruch gegen die Verarbeitung einlegen.</p>
      <p>Sie haben außerdem das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren.</p>

      <h3>11. Kontakt zum Datenschutz</h3>
      <p>Für Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte können Sie sich an folgende Adresse wenden:</p>
      <p>
        Sergej Zarev<br/>
        E-Mail: <a href="mailto:sergej.zarev@gmail.com">sergej.zarev@gmail.com</a>
      </p>
    `;
  }

  // Shorter EN / RU mirrors of the same policy structure
  if (lang === 'ru') {
    return `
      <h3>Политика конфиденциальности</h3>
      <p><em>Актуально: октябрь 2026</em></p>
      <h3>1. Ответственный</h3>
      <p>
        Sergej Zarev<br/>
        Eggersweide 18<br/>
        22159 Hamburg<br/>
        Deutschland<br/>
        E-Mail: <a href="mailto:sergej.zarev@gmail.com">sergej.zarev@gmail.com</a>
      </p>
      <h3>2. Общие сведения</h3>
      <p>DupSweep ищет точные и похожие изображения. Выбранные вами фото обрабатываются
      <strong>только локально в браузере</strong> и не загружаются на наши серверы для анализа.</p>
      <h3>3. Хостинг</h3>
      <p>Сайт размещён у Vercel (США). При посещении могут обрабатываться IP-адрес, время доступа, URL,
      данные браузера/устройства и технические логи. Подробнее:
      <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">политика Vercel</a>.</p>
      <h3>4. Локальная обработка изображений</h3>
      <p>Файлы не загружаются на наш сервер, содержимое не передаётся нам и не сохраняется у нас.
      Анализ выполняется JavaScript в вашем браузере.</p>
      <h3>5. Feedback</h3>
      <p>Добровольная форма (имя/email опционально, сообщение обязательно) отправляется через Formspree.
      Можно вместо этого скопировать текст. Политика Formspree:
      <a href="https://formspree.io/legal/privacy-policy/" target="_blank" rel="noopener noreferrer">formspree.io</a>.</p>
      <h3>6. Донаты</h3>
      <p>Кнопка Support ведёт на PayPal. Платёжные данные обрабатывает PayPal:
      <a href="https://www.paypal.com/de/webapps/mpp/ua/privacy-full" target="_blank" rel="noopener noreferrer">политика PayPal</a>.</p>
      <h3>7. Локальное хранение</h3>
      <p>Например, выбранный язык в localStorage. Эти данные нам не отправляются.</p>
      <h3>8. Трекинг</h3>
      <p>Рекламных/профильных трекеров нет. Фото не передаются третьим лицам для рекламы.</p>
      <h3>9. Контакт</h3>
      <p>Sergej Zarev · <a href="mailto:sergej.zarev@gmail.com">sergej.zarev@gmail.com</a></p>
    `;
  }

  return `
    <h3>Privacy Policy</h3>
    <p><em>Last updated: October 2026</em></p>
    <h3>1. Controller</h3>
    <p>
      Sergej Zarev<br/>
      Eggersweide 18<br/>
      22159 Hamburg<br/>
      Germany<br/>
      Email: <a href="mailto:sergej.zarev@gmail.com">sergej.zarev@gmail.com</a>
    </p>
    <h3>2. General information</h3>
    <p>DupSweep helps find identical and similar images. Selected photos are processed
    <strong>only locally in your browser</strong> and are not uploaded to our servers for analysis.</p>
    <h3>3. Website access and hosting</h3>
    <p>This website is provided via Vercel. When you visit the site, technically necessary data may be processed,
    including IP address, access time, requested URLs, browser/OS information, device/connection data and technical logs.
    Legal basis: Art. 6(1)(f) GDPR. Details:
    <a href="https://vercel.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer">Vercel Privacy Policy</a>.</p>
    <h3>4. Local image processing</h3>
    <p>Image files are processed only on your device. They are not uploaded to our server, not transmitted to us as image content,
    and not stored by us. Analysis runs via JavaScript in your browser for both exact and similar matching.</p>
    <h3>5. Feedback form</h3>
    <p>Optional name, optional email, required message are sent via Formspree. You may instead copy the message text.
    Formspree policy:
    <a href="https://formspree.io/legal/privacy-policy/" target="_blank" rel="noopener noreferrer">formspree.io</a>.</p>
    <h3>6. Donations via PayPal</h3>
    <p>The donate button redirects to PayPal. We do not collect card/bank details on this site. PayPal processes payment data under its own policy:
    <a href="https://www.paypal.com/de/webapps/mpp/ua/privacy-full" target="_blank" rel="noopener noreferrer">PayPal Privacy</a>.</p>
    <h3>7. Local browser storage</h3>
    <p>Settings such as language may be stored in localStorage and are not sent to us.</p>
    <h3>8. No ad tracking</h3>
    <p>No ad networks or advertising profile services. Images are not shared with third parties for ads/analytics.</p>
    <h3>9. Contact</h3>
    <p>Sergej Zarev · <a href="mailto:sergej.zarev@gmail.com">sergej.zarev@gmail.com</a></p>
  `;
}

export function contactHtml(lang: 'ru' | 'en' | 'de'): string {
  return `
    <h3>${lang === 'de' ? 'Kontakt / Feedback' : lang === 'ru' ? 'Контакт / Feedback' : 'Contact / Feedback'}</h3>
    <p><strong>${LEGAL.name}</strong><br/>
    ${LEGAL.addressLines.join('<br/>')}<br/>
    E-Mail: <a href="mailto:${LEGAL.email}">${LEGAL.email}</a></p>
    <p>${lang === 'de'
      ? 'Feedback und Ideen: über das Formular unter /feedback oder per E-Mail.'
      : lang === 'ru'
        ? 'Отзывы и идеи: форма /feedback или email.'
        : 'Feedback and ideas: form at /feedback or email.'}</p>
  `;
}
