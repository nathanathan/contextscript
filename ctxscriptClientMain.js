window.initializeCtxScript = function(config){
console.log("Initializing context script...");
var context = {
  location: {
    href: window.location.href,
    host: window.location.host
  }
};
var history = [];
System.import("jquery@2.1").then(function(jQuery) {
var $ = window.$;
if(jQuery && jQuery.fn && jQuery.fn.jquery) {
  $ = jQuery;
}
$(function(){
var createBox = function(output){
  var $box = $('<div class="ctxscript-box">');
  $box.append(output);
  $('#ctxscript-out').append($box);
  return $box;
};
$(document).on('click', '.ctxscript-search-btn', function ( e ) {
  doSearch($(e.target).text());
});
var doSearch = function(q){
  var currentContext = Object.create(context);
  currentContext.q = q;
  //Beware that the result might not be present.
  var historyItem = {
    context: currentContext
  };
  createBox('<span class="ctxscript-arrow">&gt;</span>' + q).addClass("ctxscript-prev");
  var ctxscript = {
    //TODO: rename $el?
    container: createBox('Loading...'),
    history: history,
    context: currentContext,
    config: config,
    setResult: function(value){
      //TODO: This should only happen once.
      this.result = value;
      historyItem.result = value;
      var $resultContainer = this.container.find('.ctxscript-result');
      if($resultContainer.length > 0) {
        $resultContainer.text(value);
      }
    }
  };
  var evaluateResult = function(result){
    ctxscript.meta = result;
    ctxscript.container.addClass("ctxscript-bar");
    //TODO Fill in template variables
    var title = result._source.context.q;
    if($.isArray(title)) {
      title = title.join(', ');
    }
    ctxscript.container.append($('<h1>').text(title));
    var $links = $('<div class="ctxscript-links">');
    $links.append(
      //TODO: Hook this button up
      $('<a class="ctxscript-source" target="_blank">Alternative Scripts</a>'),
      $('<a class="ctxscript-source" target="_blank">Show Source</a>').prop({
        href: ctxscript.config.url + '/v0/scripts/' + result._id,
      })
    );
    ctxscript.container.append($links);
    ctxscript.container = createBox();
    ctxscript.container.append('<div class="ctxscript-result"></div>');
    eval(
      traceur.Compiler.script(result._source.script)
    );
  };
  $.post(config.url + "/v0/search", {
    context: currentContext,
    user: config.user,
    key: config.key
  }).success(function(rawResp){
    ctxscript.container.empty();
    historyItem.response = JSON.parse(rawResp);
    var resp = JSON.parse(rawResp);
    if (resp.hits.length === 0) {
      ctxscript.container.append(
        '<h4>No scripts found</h4>' +
        '<button class="ctxscript-btn ctxscript-search-btn">Create a script for this context</button>' +
        '<button class="ctxscript-btn ctxscript-search-btn">Request a script for this context</button>'
      );
    } else if (resp.hits.length === 1) {
      evaluateResult(resp.hits[0]);
    } else {
      //TODO Creation dates
      ctxscript.container.append("<h4>Multiple results:</h4>");
      var $results = $("<ul>");
      resp.hits.forEach(function(result){
        var $row = $('<li>');
        var $button = $('<button class="ctxscript-btn">')
          .text(result.currentContext.q);
        $button.click(function(){
          ctxscript.container.append('<hr>');
          evaluateResult(result);
        });
        $row.append(
          $button,
          $('<a class="ctxscript-source">source</a>').prop({
            href: ctxscript.config.url + '/v0/scripts/' + result._id
          })
        );
        $results.append($row);
      });
      ctxscript.container.append($results);
    }
  }).fail(function(error, msg){
    console.log(error);
    ctxscript.container.html(
        '<h4>Error</h4>' +
        '<p>Message: ' +
          msg +
        '</p>'
    );
  });
  //Create new history array so that this context isn't included in the history
  //passed to the script.
  history = history.concat(historyItem);
};
$(document).on('click', '.ctxscript-invoke', function ( e ) {
  doSearch($('#ctxscript-q').val());
  $('#ctxscript-q').val('');
});
$(document).on('click', '.ctxscript-settings-btn', function ( e ) {
  $('.ctxscript-settings').toggle();
});
$(document).on('click', '.ctxscript-close', function ( e ) {
  $('.ctxscript-container').hide();
});
$(document).on('keypress', '#ctxscript-q', function(e) {
  if(e.which == 13) {
    doSearch($('#ctxscript-q').val());
    $('#ctxscript-q').val('');
  }
});
$('.ctxscript-invoke').prop('disabled', false);
$('.ctxscript-settings-btn').prop('disabled', false);
var $suggestions = $('<div class="ctxscript-box">');
$suggestions.append('<sup>suggestions:</sup>');
$('.ctxscript-container').append($suggestions);
});
});
};
