
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

function generateRandomPosts()
  {
      $.getJSON("/search.json", function(data) {
          console.log("[search.json loaded for random posts]");

          var postsCount = data.length;
          var posts = data;

          var randomIndexUsed = [];
          var counter = 0;
          var numberOfPosts = 3;

          var divRandomPosts = $("#random_posts");

          divRandomPosts.append('<h2>Нещодавно</h2><hr />');

          while (counter < numberOfPosts)
          {
              var randomIndex = Math.floor(Math.random() * postsCount);

              if (randomIndexUsed.indexOf(randomIndex) == "-1")
              {
                  //var postHREF = posts[randomIndex].href;
                  var postTitle = posts[randomIndex].type;

                  if (counter == (numberOfPosts - 1))
                  {
                      //divRandomPosts.append('<p><a href="' + postHREF + '">' + postTitle + '</a></p>');
                      divRandomPosts.append('<p><a href="#">' + postTitle + '</a></p>');
                  }
                  else
                  {
                      //divRandomPosts.append('<p><a href="' + postHREF + '">' + postTitle + '</a></p><hr />');
                      divRandomPosts.append('<p><a href="#">' + postTitle + '</a></p><hr />');
                  }

                  randomIndexUsed.push(randomIndex);

                  counter++;
              }
          }
      });
  }

  $(document).ready(function() {
      generateRandomPosts();
  });
