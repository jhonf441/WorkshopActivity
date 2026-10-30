# WorkshopActivity -- historial de versiones

## 2.7.7 -- 2026-10-30

- Manifest: sbcRequired true (needs WorkshopService); side bar keeps the group names

## 2.7.6 -- 2026-10-30

- Manifest: sbcRequired true (needs WorkshopService); side bar keeps the group names

## 2.7.5 -- 2026-10-29

- Phone layout fixes (44 px touch targets, no overflow), Workbench full-screen section picker, clamps hint, interrupted jobs off the table, Machine scale label

## 2.7.4 -- 2026-10-29

- Audit and UX fixes: Jog owns workzeroaxis.g, restart notice with time, shared pulse table with update and download, side bar tooltips, spacing, wider field

## 2.7.3 -- 2026-10-29

- Audit fixes: Activity (3.6) event kinds and language, S0 in the G1 text of the calculators

## 2.7.2 -- 2026-10-29

- State chips with an icon: the icon carries the color and there is no dot (family.css); chosen chip tinted

## 2.7.1 -- 2026-10-29

- PID chart read from the service (any screen), Activity shows its active filters, health state without the duplicate icon

## 2.7.0 -- 2026-10-29

- Side bars: no gray line, a chosen item goes to the start of its section; Printing: start-up chip without the mode rows, tests notice only when the chip is not green, no-sensor fault reading; Vision: settings cards packed in columns, laser crosses only with Laser mode; Zones: visible mode dot

## 2.6.32 -- 2026-10-28

- Design family: final shared styles

## 2.6.31 -- 2026-10-28

- Design family: page bar with lead, own design css removed, section color as --wf-sec

## 2.6.30 -- 2026-10-28

- Header badge icon always white; Lights: how-it-works note inside the Summary, save bar only with changes

## 2.6.29 -- 2026-10-28

- Minimalist design: neutral page bar with a solid badge, text side items with a section line, neutral cards with a 2 px top line, event kinds as dot and word, outline buttons

## 2.6.28 -- 2026-10-28

- Off notification cards keep their own height

## 2.6.27 -- 2026-10-27

- Plan warnings in words, risk dialogs in DWC style, mesh point selection, link to Machine modes

## 2.6.26 -- 2026-10-27

- Side bar no longer makes the page jump when a shorter section is chosen; start-up chip as in every page (header, same wording)

## 2.6.25 -- 2026-10-26

- Run-time guard: the 3.6 build refuses to start on a host with window.DWC and the 3.7 build outside DWC 3.7.x (visible warning); shipped as a strict per-line zip (dwcVersion 3.6 / 3.7)

## 2.6.24 -- 2026-10-26

- Shared pages: accessible names, contrast, start-up guide button and friendlier errors.

## 2.6.23 -- 2026-10-24

- Start-up assistant: active lines highlighted, single-step way back, dark select options; Lights time picker and defaults; Printing FFF switch; Mesh handles above the points

## 2.6.22 -- 2026-10-24

- Start-up card reports its pending count to the service (machine setup list)

## 2.6.21 -- 2026-10-23

- Follow a sign-in or logout made in another tab

## 2.6.20 -- 2026-10-23

- One sign-in for every tab (token in localStorage)

## 2.6.19 -- 2026-10-23

- Header: no health chip while signed out

## 2.6.18 -- 2026-10-23

- Compact live job strip in the bar; page header treats an expired session as sign in; numeric PIN field

## 2.6.17 -- 2026-10-23

- Page header asks who is signed in so a missing session is shown as such

## 2.6.16 -- 2026-10-23

- Common page header: health chip, session chip, quiet start-up icon when ready

## 2.6.15 -- 2026-10-23

- Side bar sections no longer overflow the page on narrow screens (under 900 px)

## 2.6.14 -- 2026-10-22

- Phone alerts section redesigned: colored section badges, per-event icon and color, priority and attachment tags, two-column events

## 2.6.13 -- 2026-10-22

- Phone alerts section redesigned: grouped sections, event options aligned in a grid

## 2.6.12 -- 2026-10-22

- Side-bar pin only while the bar is open; Lights panel counts only the faults the service marks

## 2.6.11 -- 2026-10-22

- Pin on every side bar, thin scrollbars, one sign-in dialog

## 2.6.10 -- 2026-10-22

- Sign-in never opens by itself; keyboard only on touch

## 2.6.9 -- 2026-10-22

- Fix names, values and catalog markers the English rename left behind

## 2.6.8 -- 2026-10-22

- Sessions made clear: not-signed-in chip, sign-in on visitor 403, refusal toast

## 2.6.7 -- 2026-10-22

- Sign-in dialog focus and kiosk keyboard helper; Jog blocked touches explained

## 2.6.6 -- 2026-10-22

- Kiosk keyboard helper call, sign-in dialog font

## 2.6.5 -- 2026-10-22

- Jog and bars tell why an action is blocked and ask for the session; Jog loses the Machine pointer sections

## 2.6.4 -- 2026-10-22

- Sign-in dialog redesign and on-screen keyboard; single floating panel for power actions; risk bar on one line; Jog gear and scrollbar; side tabs transition

## 2.6.3 -- 2026-10-21

- PIN sign enters by itself when the PIN has the length that worked last time

## 2.6.2 -- 2026-10-21

- Side bar: pin next to the fold arrow keeps the bar open

## 2.6.1 -- 2026-10-21

- Page routes in English with redirects from the old ones, localStorage keys migrated to English

## 2.6.0 -- 2026-10-21

- Role views, plain error messages with retry or PIN, only my actions filtered by the service, labels for safety checks and guard events, user shown

## 2.5.5 -- 2026-10-21

- Page reloads when the DWC language changes; Vision pins dsf-python below 3.7; meter wizard copy over http

## 2.5.4 -- 2026-10-21

- English migration: texts through the catalog, no in-browser translator, interfaces per part

## 2.5.3 -- 2026-10-21

- Live job lines in M118 form

## 2.5.2 -- 2026-10-21

- Quiet hours: time pickers in the date field style

## 2.5.1 -- 2026-10-20

- English names: remaining values, ids, theme panels and the Vision backend keys (fixes a mismatch with the page)

## 2.5.0 -- 2026-10-20

- All the code, data keys and enum values are in English; stored data is converted by the one-off migration script

## 2.4.2 -- 2026-10-18

- Start-up entry is a chip in the page header

## 2.4.1 -- 2026-10-17

- Start-up strip under the page header, same place as the other plugins

## 2.4.0 -- 2026-10-16

- Start-up card is now a dialog opened from a strip on the page (one card per function, progress, step-by-step assistant), with a plain explanation for every row

## 2.3.7 -- 2026-10-16

- Start-up assistant (shared piece), Lights: the strip pin is chosen in Advanced (plain LED removed)

## 2.3.6 -- 2026-10-15

- Start-up card (shared piece): Printing assistant renamed so it no longer collides with the card

## 2.3.5 -- 2026-10-15

- Rebuilt with the shared start-up card piece

## 2.3.4 -- 2026-10-15

- Spanish texts with accents and enie

## 2.3.3 -- 2026-10-15

- Hide every mention of another plugin when it is absent

## 2.3.2 -- 2026-10-14

- Cleanup: no more lookups of the old service Id (PiCustomCodes) or mentions of the removed custom G-codes

## 2.3.1 -- 2026-10-14

- Header card with the same padding as the other pages

## 2.3.0 -- 2026-10-14

- Today section (jobs started, finished and cancelled, job time, energy, errors, emergency stops, the jobs and the failures of Today / Yesterday / 7 days) and a Test button on every notification type that sends what a real event of that type would send

## 2.2.0 -- 2026-10-14

- Header always visible (events in the range, failures, phone alerts on/off, last event) and the side bar: History, Phone alerts, Live jobs

## 2.1.0 -- 2026-10-13

- The history, the notification types and the last sent title show the English text the service sends (needs WorkshopService 2.5.0); with an older service it keeps showing Spanish

## 2.0.3 -- 2026-10-13

- Files and macros written by the plugin are in English; bilingual risk texts

## 2.0.2 -- 2026-10-13

- The camera of each notice type is always selectable

## 2.0.1 -- 2026-10-13

- Official localization completed: no Spanish text left in the sources, texts with parameters are single keys

## 2.0.0 -- 2026-10-13

- Needs WorkshopService 2.0: calls its central API (POST /machine/WorkshopService/api) instead of the custom codes M9003 / M9010, which are gone
- Live jobs are marked with BRIDGE JOB START / BRIDGE JOB END in the start / end G-code

## 1.12.0 -- 2026-10-13

- Activity: camera of notifications, detailed history; Jog: no status lights in the header

## 1.11.0 -- 2026-10-13

- Official DWC localization: es.json / en.json via registerPluginLocalization

## 1.10.1 -- 2026-10-13

- Revert the localization pilot (page failed to render); same behaviour as 1.9.1

## 1.10.0 -- 2026-10-13

- Official DWC localization: es.json / en.json with registerPluginLocalization

## 1.9.1 -- 2026-10-13

- Sidebar closed rail and settings; shared updates; English texts pending

## 1.9.0 -- 2026-10-12

- Avisos por tipo (sin adjunto, foto o video corto, prioridad, horario de silencio), reparar fechas danadas, estado desde DWC y solo con la pagina a la vista; dwcVersion 3.6

## 1.8.0 -- 2026-10-11

- Carpetas en ingles bajo 0:/sys/workshop (datos, disenos, malla, cortar por partes); arreglos de la Mesa de trabajo

## 1.7.1 -- 2026-10-11

- Las paginas vuelven a cargar (punto y coma en safe-saving.js)

## 1.7.0 -- 2026-10-11

- Id nuevo en ingles (Workshop...) y guardado seguro ante cortes de luz

# TallerActividad -- historial de versiones

## 1.6.4 -- 2026-10-10

- Compatibilidad con los Id nuevos en ingles (busca el servicio por el Id nuevo o el viejo); sin cambiar ningun Id todavia

## 1.6.3 -- 2026-10-10

- Tipo de evento Fuego (Vision)

## 1.6.2 -- 2026-10-10

- Los comandos de la pagina van por HTTP desde el primero (antes salian por G-code mientras cargaban los plugins) y reintentan ~15 s si el servicio se esta reiniciando

## 1.6.1 -- 2026-10-10

- Estilo comun (colores de pantalla)

## 1.6.0 -- 2026-10-10

- Riesgo activo y calibraciones en el historial (tipos riesgo y calibracion con color e icono); estandar de advertencias; nombre visible del servicio

## 1.5.6 -- 2026-10-10

- Comandos M9003 en ingles; los nombres en español siguen como alias; traducciones al ingles completas

## 1.5.5 -- 2026-10-10

- Comunicacion: el aviso de falta el servicio de la Pi explica en el lugar como se comunica la Pi con la Duet (antes enlazaba a GitHub)

## 1.5.4 -- 2026-10-10

- Aviso con enlace a la explicacion cuando falta el servicio de la Pi (sin modo SBC, sin PiCustomCodes o detenido)

## 1.5.3 -- 2026-10-10

- Los trabajos en vivo (por red o USB) se nombran 'trabajo en vivo' en vez de un nombre de programa

## 1.5.2 -- 2026-10-10

- Linea de diseno comun: colores por significado, encabezado con el icono del menu, textos legibles con el tema claro de DWC

## 1.5.1 -- 2026-10-10

- Textos legibles con el tema claro de DWC

## 1.5.0 -- 2026-10-09

- Comandos recibidos se mudo a Servicios (un solo historial)

## 1.4.1 -- 2026-10-09

- Comandos recibidos: selectores de fecha con calendario, igual que el historial

## 1.4.0 -- 2026-10-09

- Historial de comandos recibidos: fecha, comando, solo errores, busqueda, respuesta completa al tocar, borrar rango

## 1.3.0 -- 2026-10-09

- Tabla con etiquetas de color por tipo, agrupada por dia y filtro rapido; boton para generar un topic ntfy nuevo

## 1.2.0 -- 2026-10-09

- Borrar un evento de la tabla o todo lo filtrado (con doble toque)

## 1.1.1 -- 2026-10-08

- Nombre visible en ingles

## 1.1.0 -- 2026-10-08

- Notificaciones al celular configurables desde aca (reemplaza duet-notify), registro de trabajos en vivo, oculta los reinicios del servicio

