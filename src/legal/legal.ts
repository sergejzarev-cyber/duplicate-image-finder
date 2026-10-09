import type { Lang } from "../types";

export const CONTACT = {
  name: "Sergej Zarev",
  street: "Eggersweide 18",
  city: "22159 Hamburg",
  country: "Deutschland",
  email: "sergej.zarev@gmail.com",
} as const;

/* ---------------- Impressum ---------------- */

const IMPRINT_DE = `Angaben gemäß § 5 DDG

Sergej Zarev
Eggersweide 18
22159 Hamburg
Deutschland

E-Mail: sergej.zarev@gmail.com

Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV:
Sergej Zarev, Anschrift wie oben

DupSweep ist ein privates, nicht kommerzielles Projekt.`;

const IMPRINT_EN = `Provider details (§ 5 DDG):

Sergej Zarev
Eggersweide 18
22159 Hamburg
Germany

Contact:
E-mail: sergej.zarev@gmail.com
Feedback form: “Feedback” button on this site

Responsible for content (§ 18 Abs. 2 MStV):
Sergej Zarev, address as above

DupSweep is a private non-commercial project.`;

const IMPRINT_RU = `Сведения о провайдере (§ 5 DDG):

Sergej Zarev
Eggersweide 18
22159 Hamburg
Deutschland

Контакт:
E-mail: sergej.zarev@gmail.com
Форма обратной связи: кнопка «Отзыв» на сайте

Ответственный за содержание (§ 18 Abs. 2 MStV):
Sergej Zarev, адрес как выше

DupSweep — частный некоммерческий проект.`;

export const IMPRINT: Record<Lang, string> = {
  de: IMPRINT_DE,
  en: IMPRINT_EN,
  ru: IMPRINT_RU,
};

/* ---------------- Datenschutzerklärung ---------------- */

const PRIVACY_DE = `1. Verantwortlicher

Verantwortlicher für die Verarbeitung personenbezogener Daten auf dieser Website ist:

Sergej Zarev
Eggersweide 18
22159 Hamburg
Deutschland

E-Mail: sergej.zarev@gmail.com

2. Allgemeine Hinweise

Der Schutz Ihrer persönlichen Daten ist uns wichtig.

Diese Website stellt das Tool DupSweep zur Suche nach identischen und ähnlichen Bildern bereit.

Ein besonderer Schwerpunkt des Dienstes liegt auf der lokalen Verarbeitung: Die von Ihnen ausgewählten Bilder werden nicht auf unsere Server hochgeladen. Die Analyse der Bilder erfolgt ausschließlich lokal in Ihrem Browser auf Ihrem eigenen Gerät.

Wir verarbeiten personenbezogene Daten nur, soweit dies für die Bereitstellung der Website, die Bearbeitung von Kontaktanfragen oder die von Ihnen ausdrücklich genutzten Funktionen erforderlich ist.

3. Aufruf der Website und Hosting

Diese Website wird über Vercel bereitgestellt.

Beim Aufruf der Website können technisch erforderliche Informationen verarbeitet werden, insbesondere:

IP-Adresse,
Datum und Uhrzeit des Zugriffs,
angeforderte Ressourcen bzw. URLs,
Informationen über Browser und Betriebssystem,
Geräte- und Verbindungsinformationen,
technische Diagnose- und Protokolldaten.

Diese Daten sind erforderlich, um die Website technisch bereitzustellen, die Sicherheit und Stabilität des Dienstes zu gewährleisten und Fehler zu erkennen.

Vercel beschreibt in seiner aktuellen Datenschutzerklärung unter anderem die Verarbeitung von IP-Adressen, Informationen über Anfragen, Zeitstempeln, Geräteinformationen und technischen Logdaten.

Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse liegt in der sicheren, stabilen und funktionsfähigen Bereitstellung unserer Website.

Vercel ist ein Anbieter mit Sitz in den USA. Bei der Nutzung der Infrastruktur können personenbezogene Daten auch außerhalb der Europäischen Union verarbeitet werden. Einzelheiten hierzu ergeben sich aus den Datenschutzinformationen von Vercel.

Datenschutzerklärung von Vercel: https://vercel.com/legal/privacy-policy

4. Lokale Bildverarbeitung

Die zentrale Funktion von DupSweep ist die Suche nach identischen und ähnlichen Bildern.

Die von Ihnen ausgewählten Bilddateien werden ausschließlich auf Ihrem eigenen Gerät verarbeitet.

Wenn Sie einen Ordner oder Bilder auswählen:

werden die Dateien nicht zu unserem Server hochgeladen;
werden die Bildinhalte nicht an uns übertragen;
werden die Bilder nicht von uns gespeichert;
erfolgt die Analyse lokal durch JavaScript in Ihrem Browser.

Dies gilt sowohl für die Suche nach identischen Dateien als auch für die Suche nach ähnlichen Bildern.

Wir haben daher keinen Zugriff auf die von Ihnen zur Analyse ausgewählten Fotos.

Wichtig: Für die Bereitstellung des Webangebots selbst ist lediglich eine Verbindung zu unserem Hosting-Anbieter Vercel erforderlich. Die Bilddateien sind davon unabhängig und werden nicht als Teil der Bildanalyse an unseren Server übertragen.

5. Feedback-Formular

Auf unserer Website besteht die Möglichkeit, freiwillig Feedback zu senden.

Dabei können Sie folgende Angaben machen:

Name (optional),
E-Mail-Adresse (optional),
Nachricht (erforderlich).

Wenn Sie das Feedback-Formular absenden, werden die von Ihnen eingegebenen Daten an Formspree übermittelt und dort verarbeitet. Formspree stellt die Übermittlung anschließend für die Bearbeitung durch uns bereit.

Formspree gibt an, dass über Formulare eingereichte Daten im jeweiligen Formspree-Konto gespeichert werden.

Die Nutzung des Feedback-Formulars ist freiwillig. Wenn Sie keine Daten an Formspree übermitteln möchten, können Sie die auf der Website angebotene Funktion zum Kopieren des Nachrichtentextes verwenden und Ihre Nachricht auf anderem Wege übermitteln.

Rechtsgrundlage für die Verarbeitung der von Ihnen freiwillig übermittelten Daten ist Art. 6 Abs. 1 lit. f DSGVO. Unser berechtigtes Interesse besteht darin, Feedback und Anfragen zu erhalten und zu beantworten.

Bitte übermitteln Sie über das Feedback-Formular keine sensiblen oder besonders geschützten personenbezogenen Daten, sofern dies für Ihre Nachricht nicht erforderlich ist.

Datenschutzinformationen von Formspree: https://www.formspree.io/legal/privacy-policy

6. Speicherdauer von Feedback

Die über das Feedback-Formular übermittelten Daten werden nur so lange gespeichert, wie dies für die Bearbeitung und Dokumentation der jeweiligen Anfrage erforderlich ist oder gesetzliche Aufbewahrungsfristen bestehen.

Die technische Speicherung der Formulareingaben bei Formspree richtet sich zusätzlich nach den dort geltenden Speicherfristen und Bedingungen. Beim kostenlosen Formspree-Tarif wird laut Anbieter ein Submission-Archiv von 30 Tagen bereitgestellt.

7. Spenden / Unterstützung über PayPal

Wenn Sie das Projekt freiwillig unterstützen möchten, können Sie die auf der Website angebotene Donate-Funktion nutzen.

Beim Anklicken des Donate-Buttons werden Sie direkt zu PayPal weitergeleitet.

Auf unserer Website werden dabei keine Zahlungsdaten wie Kreditkarten- oder Bankverbindungsdaten erhoben oder verarbeitet.

Die weitere Verarbeitung personenbezogener Daten erfolgt direkt durch PayPal nach den dort geltenden Datenschutzbestimmungen.

Datenschutzerklärung von PayPal: https://www.paypal.com/de/webapps/mpp/ua/privacy-full

Bei der Nutzung eines PayPal.Me-Links können bestimmte Profilinformationen des Zahlungsempfängers auf der PayPal.Me-Seite sichtbar sein. PayPal weist insbesondere darauf hin, dass dort Name bzw. Firmenname sowie gegebenenfalls Profilfoto/Logo und der hinterlegte Ort angezeigt werden können.

8. Lokale Speicherung im Browser

Die Website kann bestimmte Einstellungen, beispielsweise die von Ihnen ausgewählte Sprache, lokal in Ihrem Browser speichern.

Hierfür kann insbesondere die Browser-Technologie localStorage verwendet werden.

Diese Informationen werden nicht an uns übermittelt.

Soweit für eine solche Speicherung oder den Zugriff auf Informationen auf dem Endgerät eine Einwilligung erforderlich ist, wird diese entsprechend eingeholt. Nach § 25 Abs. 2 Nr. 2 TDDDG ist eine Einwilligung nicht erforderlich, wenn der Zugriff bzw. die Speicherung unbedingt erforderlich ist, um einen vom Nutzer ausdrücklich gewünschten digitalen Dienst bereitzustellen.

9. Keine Analyse- oder Werbetracking-Dienste

Auf dieser Website werden nach unserem derzeitigen Stand keine Werbenetzwerke und keine Dienste zur Erstellung von nutzerbezogenen Werbeprofilen eingesetzt.

Es werden insbesondere keine Bilder zu Analyse- oder Werbezwecken an Dritte übertragen.

10. Ihre Rechte

Sie haben nach Maßgabe der gesetzlichen Voraussetzungen insbesondere folgende Rechte:

Recht auf Auskunft über Ihre personenbezogenen Daten (Art. 15 DSGVO),
Recht auf Berichtigung unrichtiger Daten (Art. 16 DSGVO),
Recht auf Löschung (Art. 17 DSGVO),
Recht auf Einschränkung der Verarbeitung (Art. 18 DSGVO),
Recht auf Datenübertragbarkeit (Art. 20 DSGVO),
Recht auf Widerspruch gegen bestimmte Verarbeitungen (Art. 21 DSGVO).

Wenn die Verarbeitung auf Art. 6 Abs. 1 lit. f DSGVO beruht, können Sie aus Gründen, die sich aus Ihrer besonderen Situation ergeben, Widerspruch gegen die Verarbeitung einlegen.

Sie haben außerdem das Recht, sich bei einer Datenschutzaufsichtsbehörde zu beschweren.

11. Kontakt zum Datenschutz

Für Fragen zum Datenschutz oder zur Ausübung Ihrer Rechte können Sie sich an folgende Adresse wenden:

Sergej Zarev
E-Mail: sergej.zarev@gmail.com`;

const PRIVACY_EN = `1. Controller

The controller responsible for the processing of personal data on this website is:

Sergej Zarev
Eggersweide 18
22159 Hamburg
Germany

E-mail: sergej.zarev@gmail.com

2. General notes

Protecting your personal data matters to us.

This website provides the DupSweep tool for finding identical and similar images.

A particular focus of the service is local processing: the images you select are not uploaded to our servers. Image analysis takes place exclusively locally in your browser on your own device.

We process personal data only to the extent necessary to provide the website, handle contact requests, or operate functions you explicitly use.

3. Visiting the website and hosting

This website is hosted via Vercel.

When you visit the website, technically required information may be processed, in particular:

IP address,
date and time of access,
requested resources or URLs,
browser and operating system information,
device and connection information,
technical diagnostic and log data.

This data is required to technically provide the website, ensure the security and stability of the service, and detect errors.

Vercel describes in its current privacy policy, among other things, the processing of IP addresses, request information, timestamps, device information and technical log data.

The legal basis is Art. 6(1)(f) GDPR. Our legitimate interest lies in the secure, stable and functional provision of our website.

Vercel is a provider based in the USA. When using the infrastructure, personal data may also be processed outside the European Union. Details can be found in Vercel's privacy information.

Vercel privacy policy: https://vercel.com/legal/privacy-policy

4. Local image processing

The core function of DupSweep is finding identical and similar images.

The image files you select are processed exclusively on your own device.

When you select a folder or images:

the files are not uploaded to our server;
the image contents are not transmitted to us;
the images are not stored by us;
analysis runs locally via JavaScript in your browser.

This applies both to the search for identical files and to the search for similar images.

We therefore have no access to the photos you select for analysis.

Important: providing the website itself only requires a connection to our hosting provider Vercel. The image files are independent of this and are not transmitted to our server as part of the image analysis.

5. Feedback form

On our website you can voluntarily send feedback.

You may provide the following:

Name (optional),
e-mail address (optional),
message (required).

When you submit the feedback form, the data you enter is transmitted to and processed by Formspree. Formspree then makes the submission available to us for handling.

Formspree states that data submitted via forms is stored in the respective Formspree account.

Using the feedback form is voluntary. If you do not want to transmit data to Formspree, you can use the copy-message function offered on the website and send your message another way.

The legal basis for processing the data you voluntarily submit is Art. 6(1)(f) GDPR. Our legitimate interest is in receiving and answering feedback and requests.

Please do not submit sensitive or specially protected personal data via the feedback form unless necessary for your message.

Formspree privacy information: https://www.formspree.io/legal/privacy-policy

6. Feedback retention

Data submitted via the feedback form is stored only as long as necessary to handle and document the respective request, or as long as statutory retention obligations exist.

Technical storage of form entries at Formspree is additionally governed by the retention periods and terms applicable there. According to the provider, the free Formspree plan provides a 30-day submission archive.

7. Donations via PayPal

If you would like to voluntarily support the project, you can use the donate function offered on the website.

Clicking the donate button takes you directly to PayPal.

No payment data such as credit card or bank details is collected or processed on our website.

Any further processing of personal data takes place directly by PayPal under its applicable privacy terms.

PayPal privacy policy: https://www.paypal.com/de/webapps/mpp/ua/privacy-full

When using a PayPal.Me link, certain profile information of the recipient may be visible on the PayPal.Me page. PayPal notes in particular that the name or company name and, where applicable, profile photo/logo and stored location may be displayed.

8. Local storage in the browser

The website may store certain settings, such as your selected language, locally in your browser.

In particular, the localStorage browser technology may be used for this.

This information is not transmitted to us.

Where consent is required for such storage or access to information on the end device, it is obtained accordingly. Under § 25(2) No. 2 TDDDG, no consent is required where access or storage is strictly necessary to provide a digital service explicitly requested by the user.

9. No analytics or ad-tracking services

To our current knowledge, no ad networks and no services for creating user-related advertising profiles are used on this website.

In particular, no images are transmitted to third parties for analytics or advertising purposes.

10. Your rights

Subject to the statutory requirements, you have in particular the following rights:

Right of access to your personal data (Art. 15 GDPR),
Right to rectification of inaccurate data (Art. 16 GDPR),
Right to erasure (Art. 17 GDPR),
Right to restriction of processing (Art. 18 GDPR),
Right to data portability (Art. 20 GDPR),
Right to object to certain processing (Art. 21 GDPR).

Where processing is based on Art. 6(1)(f) GDPR, you may object to processing on grounds relating to your particular situation.

You also have the right to lodge a complaint with a data protection supervisory authority.

11. Privacy contact

For privacy questions or to exercise your rights, contact:

Sergej Zarev
E-mail: sergej.zarev@gmail.com

Note: the legally binding version of this policy is the German “Datenschutzerklärung”.`;

const PRIVACY_RU = `1. Ответственный

Ответственный за обработку персональных данных на этом сайте:

Sergej Zarev
Eggersweide 18
22159 Hamburg
Deutschland

E-mail: sergej.zarev@gmail.com

2. Общие сведения

Защита ваших персональных данных важна для нас.

Этот сайт предоставляет инструмент DupSweep для поиска одинаковых и похожих изображений.

Особенность сервиса — локальная обработка: выбранные вами изображения не загружаются на наши серверы. Анализ изображений выполняется исключительно локально в вашем браузере на вашем устройстве.

Мы обрабатываем персональные данные только в объёме, необходимом для работы сайта, обработки обращений или функций, которые вы явно используете.

3. Посещение сайта и хостинг

Сайт размещён на хостинге Vercel.

При посещении сайта могут обрабатываться технически необходимые данные, в частности:

IP-адрес,
дата и время доступа,
запрошенные ресурсы и URL,
данные о браузере и операционной системе,
данные об устройстве и соединении,
технические диагностические данные и логи.

Эти данные нужны, чтобы технически предоставлять сайт, обеспечивать безопасность и стабильность сервиса и находить ошибки.

Vercel в своей актуальной политике конфиденциальности описывает, помимо прочего, обработку IP-адресов, данных о запросах, временных меток, данных об устройствах и технических логов.

Правовое основание — Art. 6 Abs. 1 lit. f DSGVO. Наш законный интерес — безопасное, стабильное и работоспособное предоставление сайта.

Vercel — провайдер с местонахождением в США. При использовании инфраструктуры персональные данные могут обрабатываться и за пределами Европейского союза. Подробности — в информации о конфиденциальности Vercel.

Политика конфиденциальности Vercel: https://vercel.com/legal/privacy-policy

4. Локальная обработка изображений

Основная функция DupSweep — поиск одинаковых и похожих изображений.

Выбранные вами файлы изображений обрабатываются исключительно на вашем устройстве.

Когда вы выбираете папку или изображения:

файлы не загружаются на наш сервер;
содержимое изображений нам не передаётся;
изображения нами не сохраняются;
анализ выполняется локально средствами JavaScript в вашем браузере.

Это касается как поиска одинаковых файлов, так и поиска похожих изображений.

Поэтому у нас нет доступа к выбранным вами для анализа фотографиям.

Важно: для работы самого сайта нужно лишь соединение с нашим хостинг-провайдером Vercel. Файлы изображений от этого не зависят и в рамках анализа на наш сервер не передаются.

5. Форма отзывов

На сайте можно добровольно отправить отзыв.

Вы можете указать:

имя (необязательно),
адрес e-mail (необязательно),
сообщение (обязательно).

При отправке формы введённые данные передаются в Formspree и обрабатываются там. Formspree затем предоставляет отправку нам для обработки.

Formspree указывает, что данные, отправленные через формы, хранятся в соответствующем аккаунте Formspree.

Использование формы отзывов добровольно. Если вы не хотите передавать данные в Formspree, воспользуйтесь функцией копирования текста сообщения на сайте и отправьте сообщение другим способом.

Правовое основание обработки добровольно переданных данных — Art. 6 Abs. 1 lit. f DSGVO. Наш законный интерес — получать отзывы и обращения и отвечать на них.

Не передавайте через форму отзывов чувствительные персональные данные, если это не требуется для вашего сообщения.

Информация о конфиденциальности Formspree: https://www.formspree.io/legal/privacy-policy

6. Срок хранения отзывов

Данные из формы отзывов хранятся только пока это нужно для обработки и документирования обращения либо пока действуют законные сроки хранения.

Техническое хранение данных форм в Formspree дополнительно определяется действующими там сроками и условиями. По данным провайдера, бесплатный тариф Formspree предоставляет 30-дневный архив отправок.

7. Донаты через PayPal

Если вы хотите добровольно поддержать проект, воспользуйтесь кнопкой доната на сайте.

При нажатии вы сразу перенаправляетесь в PayPal.

Платёжные данные, такие как данные карт или банковских счетов, на нашем сайте при этом не собираются и не обрабатываются.

Дальнейшая обработка персональных данных выполняется непосредственно PayPal по его правилам конфиденциальности.

Политика конфиденциальности PayPal: https://www.paypal.com/de/webapps/mpp/ua/privacy-full

При использовании PayPal.Me-ссылки на странице PayPal.Me могут быть видны отдельные данные профиля получателя. PayPal указывает, что там могут отображаться имя или название компании, а также при наличии фото/логотип профиля и указанный город.

8. Локальное хранение в браузере

Сайт может хранить отдельные настройки, например выбранный язык, локально в вашем браузере.

Для этого может использоваться технология localStorage.

Эти данные нам не передаются.

Если для такого хранения или доступа к данным устройства требуется согласие, оно запрашивается соответствующим образом. Согласно § 25 Abs. 2 Nr. 2 TDDDG согласие не требуется, если доступ или хранение строго необходимы для предоставления цифрового сервиса, явно запрошенного пользователем.

9. Без аналитики и рекламного трекинга

Насколько нам известно, на сайте не используются рекламные сети и сервисы построения рекламных профилей пользователей.

Изображения, в частности, не передаются третьим лицам в аналитических или рекламных целях.

10. Ваши права

В соответствии с законом вы имеете, в частности, следующие права:

право на доступ к своим персональным данным (Art. 15 DSGVO),
право на исправление неточных данных (Art. 16 DSGVO),
право на удаление (Art. 17 DSGVO),
право на ограничение обработки (Art. 18 DSGVO),
право на переносимость данных (Art. 20 DSGVO),
право возражать против отдельных видов обработки (Art. 21 DSGVO).

Если обработка основана на Art. 6 Abs. 1 lit. f DSGVO, вы можете возразить против неё по основаниям, связанным с вашей конкретной ситуацией.

Вы также вправе подать жалобу в надзорный орган по защите данных.

11. Контакт по вопросам конфиденциальности

По вопросам конфиденциальности и для реализации своих прав обращайтесь:

Sergej Zarev
E-mail: sergej.zarev@gmail.com

Примечание: юридически обязательной является немецкая версия «Datenschutzerklärung».`;

export const PRIVACY: Record<Lang, string> = {
  de: PRIVACY_DE,
  en: PRIVACY_EN,
  ru: PRIVACY_RU,
};
