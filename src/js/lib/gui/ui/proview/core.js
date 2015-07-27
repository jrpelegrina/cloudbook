function ProView(){

}

ProView.prototype.initSections = function initSections() {
  var list = $(document.createElement('ul')).addClass("connectedSortable");
  $(Cloudbook.UI.navsections).html(list).attr('data-cbsectionid','root');
};

ProView.prototype.createFirstSection = function createFirstSection() {
  var backend = application.backend.core.getInstance();
  var cbsecid = backend.createFirstSection();
  var son = this.createSectionView(cbsecid);
  var list = $("[data-cbsectionid='root'] > ul");
  list.append(son);
  $($(son.children('.displaysection')).children('.divselector')).click();
  this.reloadSortable();
 
};


ProView.prototype.numberSection = function numberSection(cbsecid,parentid){
  var CBStorage = application.storagemanager.getInstance();
  var parent = CBStorage.getSectionById(parentid);
  var numbering = parent.sections.indexOf(cbsecid) + 1 ;
  if (parentid==="root"){
    var finalnumbering = String(numbering);

  }else{
    var finalnumbering = parent.numbering + "." + numbering;
   
  }
  var cbsection = CBStorage.getSectionById(cbsecid);
  cbsection.numbering=finalnumbering;
  CBStorage.setSectionById(cbsection,cbsecid);

  if (numbering < parent.sections.length){
    this.renumberSection(parentid,numbering)

  };


};

ProView.prototype.numberSubsection=function numberSubsection(cbsecid){
   var CBStorage = application.storagemanager.getInstance();
   var that=this;
   var cbsection=CBStorage.getSectionById(cbsecid)
    cbsection.sections.forEach(function(subsectionid){
    that.numberSection(subsectionid,cbsecid);
    that.numberSubsection(subsectionid)
  });


};

ProView.prototype.renumberSection=function renumberSection(parentid,neworder,type){
  var CBStorage=application.storagemanager.getInstance();
  var parent=CBStorage.getSectionById(parentid);
  var that=this;
  var action=type;
 
  parent.sections.forEach(function(e){
    if ((parent.sections.indexOf(e)+1)>neworder){
      var cbsection=CBStorage.getSectionById(e);
      
      switch (type) {

        case 'I':
          if (parentid==="root"){
            cbsection.numbering=String(parseInt(cbsection.numbering) + 1);

          }else{
          cbsection.numbering=parent.numbering + "." + String(parseInt(cbsection.numbering.split(".").pop()) + 1);
          }
          break;
      
        case 'D':
          if (parentid==="root"){
            cbsection.numbering=String(parseInt(cbsection.numbering) - 1);

          }else{
          cbsection.numbering=parent.numbering + "." + String(parseInt(cbsection.numbering.split(".").pop()) -1 );
          }
          break;
      };    

    
      CBStorage.setSectionById(cbsection,e);
        cbsection.sections.forEach(function(cbsection){
        that.numberSubsection(e)
      });
    };
  
  });   
  
};

ProView.prototype.reloadSortable = function reloadSortable(element){
  var that = this;
  var backend = application.backend.core.getInstance();
  $(".connectedSortable").sortable({
    placeholder: "ui-state-highlight",
    opacity:0.5,
    axis:"y",
    start:function(ev,ui){that.oldparent = ui.item.parent().parent().attr('data-cbsectionid');},
    stop:function(ev,ui){
      that.newparent = ui.item.parent().parent().attr('data-cbsectionid');
      if (that.oldparent !== that.newparent ){
        listoldparent = $("[data-cbsectionid=" + that.oldparent + "] > ul > li").map(function(element){return this.dataset.cbsectionid});
        listnewparent = $("[data-cbsectionid=" + that.newparent + "] > ul > li").map(function(element){return this.dataset.cbsectionid});
        backend.regenerateSubsection(that.oldparent,listoldparent.toArray());
        backend.regenerateSubsection(that.newparent,listnewparent.toArray());

      }

    },
    connectWith:".connectedSortable"}).disableSelection();

}


ProView.prototype.createSectionView = function createSectionView(cbsecid) {

  var section = $(document.createElement('li')).addClass('cbsection');
  var CBStorage = application.storagemanager.getInstance();
  section.attr('data-cbsectionid',cbsecid);

  var displaysection = $(document.createElement('div')).addClass('displaysection');
  var textsection = $(document.createElement('div')).addClass('divselector');
  var actions = $(document.createElement('button')).html('+').attr('data-toggle','dropdown').attr('id',cbsecid);
  var subsections = $(document.createElement('ul')).addClass('subsections').addClass("connectedSortable");
  textsection.append($(document.createElement('div')).html(CBStorage.getSectionById(cbsecid).name).addClass('caption'));
  
  textsection.click({that:this},this.selectSection);
  textsection.dblclick({that:this},this.doubleClick);
  actions.click({that:this},this.createMenu);
  displaysection.append([textsection,actions]);
  section.append([displaysection,subsections]);
  return section ;
};

ProView.prototype.doubleClick=function doubleClick(e){
        
  var that = e.data.that;
	var actualcbsectionid = $(e.currentTarget).closest('[data-cbsectionid]').attr('data-cbsectionid');
	that.dialogUpdateSectionName(actualcbsectionid);
      
};

ProView.prototype.createMenu = function createMenu(e) {
	var that = e.data.that;
	var element = $(e.currentTarget);
	element.contextMenu([
	{
		name: CBI18n.gettext('Insert before'),
		fun:function(){that.appendBefore(e)}
	},
	{
		name:CBI18n.gettext('Insert after'),
		fun:function(){that.appendAfter(e)}
	},
	{
		name:CBI18n.gettext('Insert subsection'),
		fun:function(){that.appendSubsection(e)}
	},
  {
    name:CBI18n.gettext('Duplicate section'),
    fun:function(){
      var section = $(element).closest('[data-cbsectionid]').get();
      that.duplicateSection(section);
    }
  },
	{
		name:CBI18n.gettext('Delete'),
		fun: function(){
      var section = $(element).closest('[data-cbsectionid]');
      var parentid = $(section).parent().closest('[data-cbsectionid]').attr('data-cbsectionid');
      var sectionid = section.attr('data-cbsectionid');
			that.dialogDeleteSection(sectionid,parentid);
		}
	},
	{
		name:CBI18n.gettext('Edit'),
		fun: function(){
			that.dialogUpdateSectionName($(element).closest('[data-cbsectionid]').attr('data-cbsectionid'));
		}
	}]);
	element.trigger('click.contextMenu',[e]);
};



ProView.prototype.appendBefore = function appendBefore(e){
  var CBStorage = application.storagemanager.getInstance();
  var that = e.data.that;
  var actualcbsectionid = $(e.currentTarget).closest('[data-cbsectionid]').attr('data-cbsectionid');
  var listparents = $(e.currentTarget).parents('.cbsection');
  var backend = application.backend.core.getInstance();
  var parent = null;
  if (listparents.length <2){
    parent = "root";
  }
  else{
    parent = $(listparents[1]).attr('data-cbsectionid');
  }
  var cbsecid = backend.appendNewSectionObjectByUID(parent,'basic',actualcbsectionid);
  var son = that.createSectionView(cbsecid);
  $(listparents[0]).before(son);
  that.reloadSortable();
  that.numberSection(cbsecid,parent);
  that.dialogUpdateSectionName(cbsecid);
  
}


ProView.prototype.appendSubsection = function appendSubsection(e){
  var that = e.data.that;
  var CBStorage = application.storagemanager.getInstance();
  var parent = $(e.currentTarget).parents('.cbsection');
  var backend = application.backend.core.getInstance();
  var parentObjectSection = $(parent[0]).attr('data-cbsectionid');
  var cbsecid = backend.appendNewSectionObjectByUID(parentObjectSection,'basic');
  var newsection = that.createSectionView(cbsecid);
  $(parent[0]).children("ul").append(newsection);

  that.reloadSortable();
  that.numberSection(cbsecid,parentObjectSection);
  that.dialogUpdateSectionName(cbsecid);
}

ProView.prototype.appendAfter = function appendAfter(e){
  var that = e.data.that;
  var actualcbsectionid = $(e.currentTarget).closest('[data-cbsectionid]').attr('data-cbsectionid');
  var CBStorage = application.storagemanager.getInstance();
  var backend = application.backend.core.getInstance();
  var listparents = $(e.currentTarget).parents('.cbsection');
  var parentObjectSection = null;
  if (listparents.length <2){
    parentObjectSection = "root";
  }
  else{
    parentObjectSection = $(listparents[1]).attr('data-cbsectionid');
  }
  var cbsecid = backend.appendNewSectionObjectByUID(parentObjectSection,'basic',actualcbsectionid,1);
  var son = that.createSectionView(cbsecid);
  $(listparents[0]).after(son);
  that.reloadSortable();
  that.numberSection(cbsecid,parentObjectSection);
  that.dialogUpdateSectionName(cbsecid);
  
}

ProView.prototype.selectSection = function selectSection(e){
  var that = e.data.that;
  var changesectionevent = new Event('changesection',{
    'bubbles':true,
    'cancelable':true
  });
  changesectionevent.detail = {'element':this};
  var canceled = false;
  [].forEach.call(document.querySelectorAll(Cloudbook.UI.targetcontent + " .cbobject"),function(element){
    var auxcanceled = element.dispatchEvent(changesectionevent);
    if (!auxcanceled) canceled = true;
  });

  if (canceled) return;
  Cloudbook.UI.cbobjectselected = null;
  if (Cloudbook.UI.selected !== undefined){
    $(Cloudbook.UI.selected.children('.displaysection')).removeClass('sectionselected');
  }
  Cloudbook.UI.selected = $($(this).parents('.cbsection')[0]);
  Cloudbook.UI.selected.children('.displaysection').addClass('sectionselected');
  var ui = application.ui.core.getInstance();
  ui.loadContent(Cloudbook.UI.selected.attr('data-cbsectionid'));

     
}

ProView.prototype.updateSectionName = function(name,cbsectionid) {
  $("li[data-cbsectionid='"+cbsectionid+"'] > div.displaysection > div.divselector").html("<div>"+name+"</div>");
};


ProView.prototype.dialogUpdateSectionName = function dialogUpdateSectionName(cbsectionid) {
  var CBStorage = application.storagemanager.getInstance();

  var controller = application.controller.getInstance();
  var template = application.util.template.getTemplate('templates/updateSectionName.hbs');
  var valor = {sectionname:CBStorage.getSectionById(cbsectionid).name};
  var dialog = $(template(valor));

  dialog.find('button').click(function(){
  	var name = $('#sectionname').val();
  	controller.updateSectionName(name,cbsectionid);
  	dialog.dialog('close');
  	dialog.remove();
  });

  dialog.find('#sectionname').keyup(function(e){
      var seccion = $('#sectionname').val();
      if(seccion==""){
      	 
	      $("#validateindicator").removeClass("glyphicon-ok").addClass("glyphicon-remove");
       	dialog.find('button').attr("disabled","disabled");		
		
      }else {
      	$("#validateindicator").addClass("glyphicon-ok").removeClass("glyphicon-remove");
       	dialog.find('button').removeAttr("disabled");
   		
      }
   }).focus();

  dialog.find('#sectionname').keypress(function(e){
      if (e.which==13){
        var seccion = $('#sectionname').val();
      	if(seccion!=""){ 
         	dialog.find('button').click();
        }
      }
  });
  dialog.dialog({modal:true,dialogClass: "cbdialog",closeOnEscape: false});

}

ProView.prototype.deleteSection = function deleteSection(parentid, cbsectionid) {
  $('[data-cbsectionid="'+cbsectionid+'"]').remove();
  $(Cloudbook.UI.targetcontent).html("");

};


ProView.prototype.dialogDeleteSection = function dialogDeleteSection(cbsectionid,parentid) {
	
  var dialog = $('<div><button id="delete">'+ CBI18n.gettext("Delete") +'</button><button id="cancel">'+ CBI18n.gettext("Cancel") +'</button></div>');
  dialog.children('#delete').click(function(){
    var controller = application.controller.getInstance();
    controller.popSubsection(parentid,cbsectionid);
    controller.deleteSection(parentid,cbsectionid);

    dialog.dialog('close');
  });  
  dialog.children('#cancel').click(function(){dialog.dialog('close');});
  dialog.dialog({dialogClass: "cbdialog",modal:true,close:function(){$(this).remove()}});

};

ProView.prototype.appendSectionToLastPosition = function(cbsectionid,parentid) {
  var that = this;
  var ui = application.ui.core.getInstance();
  var dest = $("[data-cbsectionid='"+parentid+"'] > ul").children(".cbsection:last");
  if (dest.length > 0 )
    dest.append(that.createSectionView(cbsectionid));
  else
    $("[data-cbsectionid='"+parentid+"'] > ul").append(that.createSectionView(cbsectionid));
  that.reloadSortable();
};

ProView.prototype.duplicateSection = function(htmlsectionelement) {
  
  var controller = application.controller.getInstance();
  var tempsection  = $(htmlsectionelement);
  var sectionid = tempsection.attr('data-cbsectionid');
  var parentsectionid = tempsection.parent().closest('[data-cbsectionid]').attr('data-cbsectionid');
  var newsectionid=controller.cloneSection(sectionid,parentsectionid,sectionid);
  this.numberSection(newsectionid,parentsectionid);
  this.numberSubsection(newsectionid);
  
};

ProView.prototype.appendSection = function(cbsectionid,parentid,needle,position) {
  var that = this;
  var section = that.createSectionView(cbsectionid);
  var CBStorage = application.storagemanager.getInstance();
  if(needle){
    $("[data-cbsectionid='"+needle+"']").after(section);
  }
  else{
    $("[data-cbsectionid='"+parentid+"'] > ul").append(section);
  }
  var cbsection = CBStorage.getSectionById(cbsectionid);
  cbsection.sections.forEach(function(subsectionid){
    that.appendSection(subsectionid,cbsectionid);
  });
  that.reloadSortable();
    
};



module.exports = ProView;
//@ sourceURL=file:///usr/share/cloudbook/src/js/lib/gui/proview/core.js
