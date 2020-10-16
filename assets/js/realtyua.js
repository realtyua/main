
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
          console.log("[search.json loaded for random posts]");

          var reCount = data.length;
          var re = data;

          console.log(re);

          var randomIndexUsed = [];
          var counter = 0;
          var numberOfRe = 3;

          var divRandomRe = $("#random_re");

          divRandomRe.append('<h4>Зверність увагу</h4><hr/>');

          while (counter < numberOfRe)
          {
              var randomIndex = Math.floor(Math.random() * reCount);

              if (randomIndexUsed.indexOf(randomIndex) == "-1")
              {
                  //var postHREF = posts[randomIndex].href;
                  var reType = re[randomIndex].type;
                  var re = re[randomIndex];

                  if (counter == (numberOfRe - 1))
                  {
                      //divRandomPosts.append('<p><a href="' + postHREF + '">' + postTitle + '</a></p>');
                      divRandomRe.append('<p><a href="#">' + reType + ', ' + re.id + '</a></p>');
                  } else {
                      //divRandomPosts.append('<p><a href="' + postHREF + '">' + postTitle + '</a></p><hr />');
                      divRandomRe.append('<p><a href="#">' + reType + '</a></p><hr />');
                  }

                  randomIndexUsed.push(randomIndex);

                  counter++;
              }
          }
      });
  }

  $(document).ready(function() {
      generateRandomRe();
  });
