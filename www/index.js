const es = new EventSource("queue/nicdev2/MyRecvQueue");

es.addEventListener("meta", metaEvt => {
    console.log("meta", metaEvt);
});

es.addEventListener("sqlserverevent", evt => {
    console.log("sqlserverevent", evt);
    let li = document.createElement("li");
    document.querySelector("ul").appendChild(li);
    let pre = document.createElement("pre");
    li.appendChild(pre);
    pre.textContent = JSON.stringify(JSON.parse(evt.data));
});
