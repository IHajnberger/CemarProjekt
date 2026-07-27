# Cemar - Projekt TRoad2
## Cel:
Celem projektu było stworzenie interaktywnej aplikacji webowej dla firmy CEMAR Sp. z o.o., na wzór pierwotnego TRoad'a, wzorując się stylem na obecnej stronie Cemar'u https://cemar.pro/pl/, w ramach odbywanej praktyki.
## Funkcjonalność: 

<details> 
<summary> Funkcje projektu </summary>
  
* Wybór widoku klienta lub serwisanta przy ekranie logowania
* ***Dla Klienta:***
    - **Lista wszystkich posiadanych maszyn** - z możliwością przejścia do karty Szczegóły oraz Raport, a także Rental
    - **Szczegóły maszyny** - poza standardowymi parametrami posiada również podgląd do historii przeprowadzonych serwisów oraz opcję zgłoszenia potrzeby serwisu
    - **Raport** - podgląd w postaci mapy z zaznaczonymi odcinkami z danego zakresu czasowego, a także tabela danych wyliczonych na bazie tych odcinków. Dodatkowo opcja pobrania raportu. 
  - **Instrukcje**  - w formie pilków PDF lub video, z możliwością wyszukiwania oraz filtrowania
  - **Asystent AI** - niepodpięty przykładowy widok dla klienta
  - **Konto użytkownika** - dostęp do dane personalnych oraz możliwość zmiany hasła
  - **Powiadomienia** - wgląd w możliwe powiadomienia systemowe
  - **Kontakt oraz pomoc** - dane kontaktowe oraz adres właściciela domeny
  
* ***Dla Serwisanta CEMAR'u:***
  - **Baza maszyn klientów** - z możliwością sortowania oraz wyszukiwania poszczególnych danych. Każdy wpis posiada możliwość Przejścia do karty maszyny
  - **Karta ze szczegółami maszyny** - strona zawiera podstawowe dane, a także pełne logi operacyjne urządzenia podzielone na: <br>
SERWIS, ZGŁOSZENIA, ERROR CODE oraz ODPALENIA REFERENCYJNE. <br>
Serwisant z poziomu tego widoku ma dostęp do:
    - *Szczegółowych logów maszyny* (parametrów pobieranych podczas pracy urządzenia) 
    - *Opcję zgłoszenia potrzeby serwisu*
    - *Dokładny wgląd w poszczególne logi operacyjne* - złożone zgłoszenia, odbyte serwisy, a także dane szczegółów odpalenia referencyjnego 
  - **Analiza telemetryczna** - tabela z wszystkimi statystykami otrzymywanymi z maszyny co 10 sekund, dane podzielone są na fazy pracy oraz etapy
  - **Zgłoszenie serwisu**  
  - **Podgląd do złożonego zgłoszenia**
  - **Podgląd do zakończonego serwisu**
  - **Odpalenie referenfyjne** - pobrane dane do przeglądu
  - **Wycena** - zawierająca pełny formularz dla serwisanta, z opcją dodania:
    - *Uwag i zaleceń serwisanta* - z funkcją Speech to Text
    - *Dokumentacja Fotograficzna* -  z możliwością dodania zdjęcia z galerii lub zrobienia zdjęcia na bieżąco; dodane zdjęcie można w każdej chwili usunąć. 
  
  &nbsp; &nbsp; &nbsp; &nbsp; Wycena została przystosowana do urządzeń mobilnych w ramach płynniejszego użytkowania przez serwisanta.
  - **Serwis** - strona umożliwiająca edytowanie istniejących wycen
  - **Konto użytkownika** - dostęp do dane personalnych oraz możliwość zmiany hasła

* ***Dla Serwisanta Outsider'a:***
  - **Baza maszyn klientów** - z możliwością sortowania oraz wyszukiwania poszczególnych danych. Każdy wpis posiada możliwość Przejścia do karty maszyny
  - **Karta ze szczegółami maszyny** - strona zawiera podstawowe dane, a także pełne logi operacyjne urządzenia podzielone na: <br>
SERWIS, ZGŁOSZENIA, ERROR CODE oraz ODPALENIA REFERENCYJNE. <br>
Serwisant z poziomu tego widoku ma dostęp do:
    - *Szczegółowych logów maszyny* (parametrów pobieranych podczas pracy urządzenia) 
    - *Dokładny wgląd w poszczególne logi operacyjne* - złożone zgłoszenia, odbyte serwisy, a także dane szczegółów odpalenia referencyjnego 
  - **Konto użytkownika** - dostęp do dane personalnych oraz możliwość zmiany hasła

* ***Dla Opiekuna klienta:***
  - **Baza maszyn klientów** - z możliwością sortowania oraz wyszukiwania poszczególnych danych. Każdy wpis posiada możliwość Przejścia do karty maszyny
  - **Karta ze szczegółami maszyny** - strona zawiera podstawowe dane, a także pełne logi operacyjne urządzenia podzielone na: <br>
SERWIS, ZGŁOSZENIA, ERROR CODE oraz ODPALENIA REFERENCYJNE. <br>
Serwisant z poziomu tego widoku ma dostęp do:
    - *Szczegółowych logów maszyny* (parametrów pobieranych podczas pracy urządzenia) 
    - *Dokładny wgląd w poszczególne logi operacyjne* - złożone zgłoszenia, odbyte serwisy, a także dane szczegółów odpalenia referencyjnego 
  - **Rental**
  - **Wycena** - zawierająca pełny formularz dla serwisanta (podgląd)
  - **Zarządzanie Kartami Maszyn**
  - **Przypisanie Dystrybutora, Klienta i Serwisanta**

* ***Dla Dystrybutora:***

* ***Dla Administratora:***
</details>


## Budowa projektu:
<details>
<summary> Projekt został podzielony na: </summary>
  
  * plik styl.css zawierający implementacje styli użytych na stronie
  * plik .js z implemntacjami funkcji
  * pliki .html dla poszczególnych stron:
    * Klient
    * Serwisant CEMAR'u
    * Serwisant Outsider
    * Opiekun klienta
    * Dystrybutor
    * Admin
    * oraz dwa dodatkowe role nieprzypisane na tą chwilę

</details>

## Podgląd strony:
stan z dnia: 27.07.2026 godzina: 8:30

https://cemartroad2.netlify.app/

Znowu padło continuous deployment. Nienawidzę chciwych wielkich korporacji z debilną polityką.
## Pierwszy model - Figma:
### Model UI:
https://www.figma.com/design/UVaKYIwzOtoJYkFxFBSIW0/Cemar?node-id=0-1&t=WUInL01daNpfY4rf-1

## Raporty:
<details>
<summary> tba </summary>
</details>

