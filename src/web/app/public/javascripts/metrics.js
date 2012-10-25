// Grab the API
var lede = api;

var graph = Viva.Graph.graph();
var nodeSize = 24;
var seed = 225;

// Set custom nodes appearance
var graphics = Viva.Graph.View.svgGraphics();

function addLinks(postId, callback) {

  lede.link.fromPost(postId, function(data) {
    _.each(data, function(link) {
      if(link.to_post_id) {
         console.log("Adding link from " + postId + " to " + link.uri);
        graph.addNode(link.to_post_id, {title: link.title, url: link.uri});
        graph.addLink(postId, link.to_post_id);
        addLinks(link.to_post_id, function(){});
      } else {
        console.log("Reached end of the link chain from post " + postId);
        return;
      }
    });
  });
  callback();
}

function renderGraph() {
    var renderer = Viva.Graph.View.renderer(graph, {graphics: graphics});
    renderer.run();
}

$(function(){

  graphics.node(function(node) {
    // The function is called every time renderer needs a ui to display node
    if(_.isUndefined(node.data)) {
      var postTitle = 'No title';
    } else {
      var postTitle = node.data.title;
    }
    
    var ui = Viva.Graph.svg('g'); //.attr('xlink:href', 'http://google.com');
    var svgLink = Viva.Graph.svg('a').attr('href', 'http://google.com');
    var svgText = Viva.Graph.svg('text')
      .attr('y', '-4px').text(postTitle)
      .attr('style', 'font-size: 75%')
    var rect = Viva.Graph.svg('rect')
      .attr('height', 10)
      .attr('width', 10)
      .attr('fill', '#C80815');
   
    svgLink.append(rect);
    svgLink.append(svgText);
    ui.append(svgLink);

    return ui;
  }).placeNode(function(nodeUI, pos) {
    // http://www.w3.org/TR/SVG/coords.html#SVGGlobalTransformAttribut
    nodeUI.attr('transform', 
                'translate(' + 
                  (pos.x - nodeSize/4) + ',' + (pos.y - nodeSize/4) + 
                ')');
  }); 

  //TODO: get seed from ui input
  addLinks(seed, renderGraph)
});
