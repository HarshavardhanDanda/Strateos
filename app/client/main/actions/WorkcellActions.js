import ajax        from 'main/util/ajax';
import WorkcellAPI from 'main/api/WorkcellAPI';
import Dispatcher  from 'main/dispatcher';
import Urls        from 'main/util/urls';

const WorkcellActions = {

  loadWorkcellsByLabId(labId) {
    const success = (result) => Dispatcher.dispatch({
      type: 'WORKCELLS_API_LIST',
      entities: result
    });

    // Query workcells from the legacy database
    const rorWorkcells = WorkcellAPI.index({
      filters: {
        lab_id: labId
      }
    }).done((result) => {
      return result.data.map(workcell => {
        workcell.lab_id = labId;
        return workcell;
      });
    });

    // Query workcells from AMS and concatenate both.
    const workcellsUrl = Urls.ams_managed_submittable_services(labId);
    return ajax.get(workcellsUrl)
      .then(amsWorkcells => {
        const amsWorkcellsReshaped = amsWorkcells.map(workcell => {
          workcell.workcell_id = workcell.node_id;
          workcell.lab_id = labId;
          workcell.workcell_type = 'mcx';
          return workcell;
        });
        return rorWorkcells.done((response) => {
          success(response.data.concat(amsWorkcellsReshaped));
        });
      }, () => rorWorkcells.done((response) => success(response.data)));
  },
  fetchWorkcellsFromAMS(labId) {
    const workcellsUrl = labId ? `${Urls.ams_workcells()}?filter[lab_id]=${labId}` : Urls.ams_workcells();
    return ajax.get(workcellsUrl)
      .done(result => {
        return result.content;
      });
  }
};

export default WorkcellActions;
