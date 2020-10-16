
var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-toggle="tooltip"]'));
var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
  return new bootstrap.Tooltip(tooltipTriggerEl)
});

$('.nav-tabs>li>a.nav-link').on('click', function(){
    $('.navbar-collapse').collapse('hide');
})

$(document).on('click', function (e) {
    if ($(e.target).closest(".card").length === 0) {
        $('.collapse').collapse('hide');
    }
});

$(document).ready(function(){
  $('.toast').toast('show');
  $('.alert').alert();
});

function generateRandomRe()
  {
      $.getJSON("https://www.realestate.if.ua/region/city/ivano-frankivsk/data/all.json", function(data) {
          // console.log("[search.json loaded for random posts]");

          var count = data.length;

          var random = [];
          var counter = 0;
          var number = 3;

          var div = $("#random_re");

          div.append('<h4>Зверність увагу</h4><hr/>');

          while (counter < number) {

              var i = Math.floor(Math.random() * count);

              if (random.indexOf(i) == "-1") {
                  //var postHREF = posts[randomIndex].href;
                  //var reType = re[randomIndex].type;

                  if (counter == (number - 1)) {
                      //divRandomPosts.append('<p><a href="' + postHREF + '">' + postTitle + '</a></p>');
                      div.append('<p><a href="#">Продаю ' + data[i].type + ', ' + data[i].id + '</a></p>');
                  } else {
                      //divRandomPosts.append('<p><a href="' + postHREF + '">' + postTitle + '</a></p><hr />');
                      div.append('<p><a href="#">Продаю ' + data[i].type + ', ' + data[i].id + '</a></p><hr />');
                  }

                  random.push(i);

                  counter++;
              }
          }
      });
  }

  $(document).ready(function() {
      generateRandomRe();
  });
