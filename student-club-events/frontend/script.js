 function showLoginMessage() {

    alert(
        "Chức năng đăng nhập sẽ được xây dựng sau."
    );

}


function joinClub(clubName) {

    alert(
        "Bạn đã chọn tham gia: "
        + clubName
    );

}


function registerEvent(eventName) {

    alert(
        "Bạn đã chọn đăng ký: "
        + eventName
    );

}


function searchClubs() {

    const keyword =
        document
        .getElementById("clubSearch")
        .value
        .toLowerCase();


    const cards =
        document.querySelectorAll(
            ".club-card"
        );


    cards.forEach(function(card) {

        const name =
            card
            .getAttribute("data-name")
            .toLowerCase();


        if (name.includes(keyword)) {

            card.style.display = "";

        } else {

            card.style.display = "none";

        }

    });

}