const saveDataToDB = async (Model, data) => {
  return await Model.create(data);
};

module.exports = saveDataToDB ;
