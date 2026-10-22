"""Курс A1 для Pričko: темы → уроки → задания. Запуск: python3 tools/course.py → app/src/course.json"""
import json, random, pathlib
random.seed(7)
W = lambda sr, ru, en: {"sr": sr, "ru": ru, "en": en}
UNITS = [
 {"id": "pozdravi", "title": W("Pozdravi", "Приветствия", "Greetings"), "color": "#2D3C78",
  "words": [W("zdravo","привет","hello"), W("dobar dan","добрый день","good afternoon"), W("dobro jutro","доброе утро","good morning"),
            W("dobro veče","добрый вечер","good evening"), W("laku noć","спокойной ночи","good night"), W("ćao","пока","bye"),
            W("hvala","спасибо","thank you"), W("molim","пожалуйста","please"), W("izvinite","извините","excuse me"),
            W("da","да","yes"), W("ne","нет","no"), W("doviđenja","до свидания","goodbye")],
  "sents": [W("Kako si?","Как дела?","How are you?"), W("Dobro sam, hvala.","Хорошо, спасибо.","I am fine, thank you."),
            W("Kako se zoveš?","Как тебя зовут?","What is your name?"), W("Zovem se Marko.","Меня зовут Марко.","My name is Marko."),
            W("Drago mi je.","Приятно познакомиться.","Nice to meet you."), W("Ja sam Ana.","Я Ана.","I am Ana.")],
  "fill": [{"sr": "Dobro ___, hvala.", "opts": ["sam", "si", "je"], "ok": "sam", "ru": "Хорошо, спасибо.", "en": "I am fine, thanks."},
           {"sr": "Kako se ___?", "opts": ["zoveš", "zovem", "zove"], "ok": "zoveš", "ru": "Как тебя зовут?", "en": "What is your name?"}]},
 {"id": "pekara", "title": W("Pekara","Пекарня","Bakery"), "color": "#B8322A",
  "words": [W("hleb","хлеб","bread"), W("burek","бурек","burek"), W("kifla","булочка","bread roll"), W("jogurt","йогурт","yogurt"),
            W("kafa","кофе","coffee"), W("voda","вода","water"), W("sir","сыр","cheese"), W("meso","мясо","meat"),
            W("mleko","молоко","milk"), W("pekara","пекарня","bakery")],
  "sents": [W("Jedan burek, molim.","Один бурек, пожалуйста.","One burek, please."), W("Koliko košta?","Сколько стоит?","How much is it?"),
            W("Hoću kafu.","Я хочу кофе.","I want coffee."), W("Jednu kiflu i jogurt.","Одну булочку и йогурт.","One roll and a yogurt."),
            W("Imate li hleb?","У вас есть хлеб?","Do you have bread?"), W("Hvala, doviđenja!","Спасибо, до свидания!","Thank you, goodbye!")],
  "fill": [{"sr": "Burek sa ___, molim.", "opts": ["sirom", "sir", "sira"], "ok": "sirom", "ru": "Бурек с сыром, пожалуйста.", "en": "A cheese burek, please."},
           {"sr": "Hoću ___.", "opts": ["kafu", "kafa", "kafe"], "ok": "kafu", "ru": "Я хочу кофе.", "en": "I want coffee."}]},
 {"id": "brojevi", "title": W("Brojevi","Числа","Numbers"), "color": "#E2A23A",
  "words": [W("jedan","один","one"), W("dva","два","two"), W("tri","три","three"), W("četiri","четыре","four"), W("pet","пять","five"),
            W("šest","шесть","six"), W("sedam","семь","seven"), W("osam","восемь","eight"), W("devet","девять","nine"), W("deset","десять","ten")],
  "sents": [W("To je sto dinara.","Это сто динаров.","That is a hundred dinars."), W("Dve kafe, molim.","Два кофе, пожалуйста.","Two coffees, please."),
            W("Koliko imaš godina?","Сколько тебе лет?","How old are you?"), W("Imam deset godina.","Мне десять лет.","I am ten years old."),
            W("Tri kifle i voda.","Три булочки и вода.","Three rolls and water.")],
  "fill": [{"sr": "Imam ___ godina.", "opts": ["deset", "deseti", "desetu"], "ok": "deset", "ru": "Мне десять лет.", "en": "I am ten."},
           {"sr": "___ kafe, molim.", "opts": ["Dve", "Dva", "Dvoje"], "ok": "Dve", "ru": "Два кофе, пожалуйста.", "en": "Two coffees, please."}]},
 {"id": "grad", "title": W("Grad","Город","City"), "color": "#5E7F3C",
  "words": [W("taksi","такси","taxi"), W("autobus","автобус","bus"), W("tramvaj","трамвай","tram"), W("stanica","остановка","stop"),
            W("ulica","улица","street"), W("trg","площадь","square"), W("levo","налево","left"), W("desno","направо","right"),
            W("pravo","прямо","straight"), W("grad","город","city")],
  "sents": [W("Gde je stanica?","Где остановка?","Where is the stop?"), W("Idem levo.","Я иду налево.","I am going left."),
            W("Do Slavije, molim vas.","До Славии, пожалуйста.","To Slavija, please."), W("Idite pravo.","Идите прямо.","Go straight."),
            W("Ovo je moja ulica.","Это моя улица.","This is my street.")],
  "fill": [{"sr": "Živim u ___.", "opts": ["Beogradu", "Beograd", "Beograda"], "ok": "Beogradu", "ru": "Я живу в Белграде.", "en": "I live in Belgrade."},
           {"sr": "Idem do ___.", "opts": ["stanice", "stanica", "stanicu"], "ok": "stanice", "ru": "Я иду до остановки.", "en": "I am going to the stop."}]},
 {"id": "porodica", "title": W("Porodica","Семья","Family"), "color": "#7A4E9C",
  "words": [W("mama","мама","mom"), W("tata","папа","dad"), W("brat","брат","brother"), W("sestra","сестра","sister"), W("sin","сын","son"),
            W("ćerka","дочь","daughter"), W("baka","бабушка","grandma"), W("deka","дедушка","grandpa"), W("muž","муж","husband"), W("žena","жена","wife")],
  "sents": [W("Ovo je moja mama.","Это моя мама.","This is my mom."), W("Imam brata i sestru.","У меня есть брат и сестра.","I have a brother and a sister."),
            W("Moja baka živi u Nišu.","Моя бабушка живёт в Нише.","My grandma lives in Niš."), W("Volim svoju porodicu.","Я люблю свою семью.","I love my family.")],
  "fill": [{"sr": "Idem u park sa ___.", "opts": ["tatom", "tata", "tate"], "ok": "tatom", "ru": "Я иду в парк с папой.", "en": "I am going to the park with dad."},
           {"sr": "Imam ___ i sestru.", "opts": ["brata", "brat", "bratom"], "ok": "brata", "ru": "У меня есть брат и сестра.", "en": "I have a brother and a sister."}]},
 {"id": "kafana", "title": W("Kafana","Кафана","Kafana"), "color": "#8A5A2B",
  "words": [W("čaša","стакан","glass"), W("tanjir","тарелка","plate"), W("ćevapi","чевапи","ćevapi"), W("supa","суп","soup"), W("salata","салат","salad"),
            W("pivo","пиво","beer"), W("konobar","официант","waiter"), W("račun","счёт","bill"), W("meni","меню","menu"), W("vino","вино","wine")],
  "sents": [W("Može račun, molim?","Можно счёт, пожалуйста?","Can I have the bill, please?"), W("Jednu supu i salatu.","Один суп и салат.","One soup and a salad."),
            W("Živeli!","Будем здоровы!","Cheers!"), W("Ćevapi su odlični.","Чевапи отличные.","The ćevapi are excellent."),
            W("Čašu vode, molim.","Стакан воды, пожалуйста.","A glass of water, please.")],
  "fill": [{"sr": "Kafa sa ___, molim.", "opts": ["mlekom", "mleko", "mleka"], "ok": "mlekom", "ru": "Кофе с молоком, пожалуйста.", "en": "Coffee with milk, please."},
           {"sr": "Čašu ___, molim.", "opts": ["vode", "voda", "vodom"], "ok": "vode", "ru": "Стакан воды, пожалуйста.", "en": "A glass of water, please."}]},
 {"id": "dani", "title": W("Dani i vreme","Дни и время","Days and time"), "color": "#1CB0F6",
  "words": [W("ponedeljak","понедельник","Monday"), W("utorak","вторник","Tuesday"), W("sreda","среда","Wednesday"), W("četvrtak","четверг","Thursday"),
            W("petak","пятница","Friday"), W("subota","суббота","Saturday"), W("nedelja","воскресенье","Sunday"), W("danas","сегодня","today"),
            W("sutra","завтра","tomorrow"), W("juče","вчера","yesterday")],
  "sents": [W("Danas je petak.","Сегодня пятница.","Today is Friday."), W("Vidimo se sutra!","Увидимся завтра!","See you tomorrow!"),
            W("Koliko je sati?","Который час?","What time is it?"), W("Radim od ponedeljka do petka.","Я работаю с понедельника по пятницу.","I work from Monday to Friday."),
            W("Juče je bila sreda.","Вчера была среда.","Yesterday was Wednesday.")],
  "fill": [{"sr": "Radim od ___ do petka.", "opts": ["ponedeljka", "ponedeljak", "ponedeljku"], "ok": "ponedeljka", "ru": "Я работаю с понедельника по пятницу.", "en": "I work from Monday to Friday."},
           {"sr": "Danas ___ petak.", "opts": ["je", "si", "sam"], "ok": "je", "ru": "Сегодня пятница.", "en": "Today is Friday."}]},
 {"id": "prodavnica", "title": W("Prodavnica","Магазин","Shop"), "color": "#FF9600",
  "words": [W("jabuka","яблоко","apple"), W("banana","банан","banana"), W("paradajz","помидор","tomato"), W("krompir","картошка","potato"),
            W("jaja","яйца","eggs"), W("so","соль","salt"), W("šećer","сахар","sugar"), W("ulje","масло","oil"), W("kesa","пакет","bag"), W("kasa","касса","checkout")],
  "sents": [W("Gde je kasa?","Где касса?","Where is the checkout?"), W("Treba mi kesa.","Мне нужен пакет.","I need a bag."),
            W("Kilo jabuka, molim.","Килограмм яблок, пожалуйста.","A kilo of apples, please."), W("Mogu li da platim karticom?","Можно оплатить картой?","Can I pay by card?"),
            W("Imate li sveža jaja?","У вас есть свежие яйца?","Do you have fresh eggs?")],
  "fill": [{"sr": "Mogu li da platim ___?", "opts": ["karticom", "kartica", "karticu"], "ok": "karticom", "ru": "Можно оплатить картой?", "en": "Can I pay by card?"},
           {"sr": "Kilo ___, molim.", "opts": ["jabuka", "jabuke", "jabukom"], "ok": "jabuka", "ru": "Килограмм яблок, пожалуйста.", "en": "A kilo of apples, please."}]},
 {"id": "stan", "title": W("Stan","Квартира","Home"), "color": "#CE82FF",
  "words": [W("kuća","дом","house"), W("stan","квартира","apartment"), W("soba","комната","room"), W("kuhinja","кухня","kitchen"),
            W("kupatilo","ванная","bathroom"), W("krevet","кровать","bed"), W("sto","стол","table"), W("stolica","стул","chair"),
            W("prozor","окно","window"), W("vrata","дверь","door")],
  "sents": [W("Moj stan je mali.","Моя квартира маленькая.","My apartment is small."), W("Gde je kupatilo?","Где ванная?","Where is the bathroom?"),
            W("Mačka spava na krevetu.","Кошка спит на кровати.","The cat sleeps on the bed."), W("Otvori prozor, molim te.","Открой окно, пожалуйста.","Open the window, please."),
            W("Živim u stanu sa sestrom.","Я живу в квартире с сестрой.","I live in an apartment with my sister.")],
  "fill": [{"sr": "Mačka spava na ___.", "opts": ["krevetu", "krevet", "kreveta"], "ok": "krevetu", "ru": "Кошка спит на кровати.", "en": "The cat sleeps on the bed."},
           {"sr": "Živim sa ___.", "opts": ["sestrom", "sestra", "sestru"], "ok": "sestrom", "ru": "Я живу с сестрой.", "en": "I live with my sister."}]},
]

def toks(s): return [w.strip(".,!?") for w in s.split() if w.strip(".,!?")]
def lesson_ex(u, words, sents, fills, rnd):
    ex = []
    others = [w for w in u["words"] if w not in words]
    for w in words[:3]: ex.append({"t": "mc_sr", "item": w, "wrong": rnd.sample([x for x in u["words"] if x != w], 3)})
    ex.append({"t": "pairs", "items": rnd.sample(words, min(5, len(words)))})
    for w in words[3:5]: ex.append({"t": "mc_ui", "item": w, "wrong": rnd.sample([x for x in u["words"] if x != w], 3)})
    for w in words[-2:]: ex.append({"t": "listen_choose", "item": w, "wrong": rnd.sample([x for x in u["words"] if x != w], 3)})
    for s in sents[:2]:
        dis = rnd.sample([t for w in u["words"] for t in toks(w["sr"]) if t.lower() not in [x.lower() for x in toks(s["sr"])]], 3)
        ex.append({"t": "tiles_sr", "item": s, "extra": dis})
    for s in sents[2:3]: ex.append({"t": "tiles_ui", "item": s})
    for f in fills: ex.append({"t": "fill", "item": f})
    if sents: ex.append({"t": "listen_type", "item": rnd.choice(sents)})
    if sents: ex.append({"t": "speak", "item": sents[0]})
    head, tail = ex[:3], ex[3:]; rnd.shuffle(tail)
    return head + tail

course = []
for u in UNITS:
    rnd = random.Random(u["id"])
    w, s, f = u["words"], u["sents"], u["fill"]
    h = len(w) // 2
    lessons = [
        {"id": f"{u['id']}-1", "ex": lesson_ex(u, w[:h], s[:2], [], rnd)},
        {"id": f"{u['id']}-2", "ex": lesson_ex(u, w[h:], s[2:4], f[:1], rnd)},
        {"id": f"{u['id']}-3", "ex": lesson_ex(u, rnd.sample(w, 6), s[3:] + s[:1], f[1:], rnd)},
    ]
    course.append({"id": u["id"], "title": u["title"], "color": u["color"], "lessons": lessons})
out = pathlib.Path(__file__).resolve().parent.parent / "app" / "src" / "course.json"
out.write_text(json.dumps(course, ensure_ascii=False))
print(sum(len(l["ex"]) for u in course for l in u["lessons"]), "заданий,", sum(len(u["lessons"]) for u in course), "уроков")
