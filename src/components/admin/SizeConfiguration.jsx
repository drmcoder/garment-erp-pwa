import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Edit,
  Save,
  X,
  Package,
  Settings,
  Check,
  AlertTriangle,
  Copy,
  Download,
  Upload,
} from "lucide-react";
import { useLanguage } from "../../context/LanguageContext";

const SizeConfiguration = ({ onClose, onSave }) => {
  const {
    t,
    currentLanguage,
    sizeConfigurations,
    articleSizeMapping,
    sizeUtils,
  } = useLanguage();

  const [configurations, setConfigurations] = useState(sizeConfigurations);
  const [articleMappings, setArticleMappings] = useState(articleSizeMapping);
  const [newArticle, setNewArticle] = useState({
    number: "",
    sizeConfig: "standard-shirt",
  });
  const [editingConfig, setEditingConfig] = useState(null);
  const [newConfigName, setNewConfigName] = useState("");
  const [errors, setErrors] = useState({});
  const [activeTab, setActiveTab] = useState("mappings");

  // Sample articles for demonstration
  const [articles, setArticles] = useState([
    { number: "8085", name: "Polo T-Shirt", currentConfig: "standard-shirt" },
    {
      number: "2233",
      name: "Round Neck T-Shirt",
      currentConfig: "standard-shirt",
    },
    { number: "6635", name: "3-Button Tops", currentConfig: "kids-sizes" },
    { number: "1020", name: "Ladies Pants", currentConfig: "numeric-sizes" },
    { number: "1022", name: "Leggings", currentConfig: "numeric-sizes" },
    { number: "9001", name: "Plus Size Shirt", currentConfig: "plus-sizes" },
    { number: "7001", name: "Scarves", currentConfig: "free-size" },
    { number: "S001", name: "Sports Shoes", currentConfig: "shoe-sizes" },
  ]);

  const validateArticleNumber = (number) => {
    if (!number) return "Article number is required";
    if (
      articles.some(
        (a) => a.number === number && a.number !== editingConfig?.originalNumber
      )
    ) {
      return "Article number already exists";
    }
    return null;
  };

  const validateSizes = (sizes) => {
    if (!sizes || sizes.length === 0) return "At least one size is required";
    if (sizes.some((size) => !size.trim()))
      return "Empty sizes are not allowed";
    if (new Set(sizes).size !== sizes.length)
      return "Duplicate sizes are not allowed";
    return null;
  };

  const handleSaveConfiguration = (configId, newData) => {
    const error = validateSizes(newData.sizes);
    if (error) {
      setErrors((prev) => ({ ...prev, [configId]: error }));
      return;
    }

    setConfigurations((prev) => ({
      ...prev,
      [configId]: {
        ...prev[configId],
        ...newData,
      },
    }));

    setEditingConfig(null);
    setErrors((prev) => ({ ...prev, [configId]: null }));
  };

  const handleAddArticle = () => {
    const error = validateArticleNumber(newArticle.number);
    if (error) {
      setErrors((prev) => ({ ...prev, newArticle: error }));
      return;
    }

    setArticles((prev) => [
      ...prev,
      {
        number: newArticle.number,
        name: newArticle.name || `Article ${newArticle.number}`,
        currentConfig: newArticle.sizeConfig,
      },
    ]);

    setArticleMappings((prev) => ({
      ...prev,
      [newArticle.number]: newArticle.sizeConfig,
    }));

    setNewArticle({ number: "", name: "", sizeConfig: "standard-shirt" });
    setErrors((prev) => ({ ...prev, newArticle: null }));
  };

  const handleDeleteArticle = (articleNumber) => {
    setArticles((prev) => prev.filter((a) => a.number !== articleNumber));
    setArticleMappings((prev) => {
      const updated = { ...prev };
      delete updated[articleNumber];
      return updated;
    });
  };

  const handleUpdateArticleMapping = (articleNumber, newConfigId) => {
    setArticles((prev) =>
      prev.map((a) =>
        a.number === articleNumber ? { ...a, currentConfig: newConfigId } : a
      )
    );
    setArticleMappings((prev) => ({
      ...prev,
      [articleNumber]: newConfigId,
    }));
  };

  const handleCreateCustomConfig = () => {
    if (!newConfigName.trim()) {
      setErrors((prev) => ({
        ...prev,
        newConfig: "Configuration name is required",
      }));
      return;
    }

    const configId = `custom-${Date.now()}`;
    setConfigurations((prev) => ({
      ...prev,
      [configId]: {
        name: newConfigName,
        nameNepali: newConfigName,
        sizes: ["S", "M", "L", "XL"],
        articles: [],
      },
    }));

    setNewConfigName("");
    setErrors((prev) => ({ ...prev, newConfig: null }));
  };

  const exportConfiguration = () => {
    const data = {
      configurations,
      articleMappings,
      articles,
      exportDate: new Date().toISOString(),
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "size-configuration.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  const ConfigurationsList = () => (
    <div className="space-y-4">
      {Object.entries(configurations).map(([configId, config]) => (
        <div
          key={configId}
          className="bg-white rounded-lg border border-gray-200 p-4"
        >
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="font-medium text-gray-800">
                {currentLanguage === "np" ? config.nameNepali : config.name}
              </h3>
              <p className="text-sm text-gray-600">
                {config.sizes.length} {t("sizes")} |{" "}
                {config.articles?.length || 0} {t("articles")}
              </p>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  setEditingConfig({
                    configId,
                    ...config,
                    originalSizes: [...config.sizes],
                  })
                }
                className="p-2 text-blue-600 hover:bg-blue-50 rounded transition-colors"
              >
                <Edit className="w-4 h-4" />
              </button>
              {configId.startsWith("custom-") && (
                <button
                  onClick={() => {
                    const updated = { ...configurations };
                    delete updated[configId];
                    setConfigurations(updated);
                  }}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          {editingConfig?.configId === configId ? (
            <EditConfigurationForm
              config={editingConfig}
              onSave={(data) => handleSaveConfiguration(configId, data)}
              onCancel={() => setEditingConfig(null)}
              error={errors[configId]}
            />
          ) : (
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {config.sizes.map((size, index) => (
                  <span
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {size}
                  </span>
                ))}
              </div>

              {config.articles && config.articles.length > 0 && (
                <div className="text-xs text-gray-500">
                  {t("usedBy")}: {config.articles.join(", ")}
                </div>
              )}
            </div>
          )}
        </div>
      ))}

      {/* Add New Configuration */}
      <div className="bg-gray-50 rounded-lg border-2 border-dashed border-gray-300 p-6">
        <div className="text-center">
          <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
          <h3 className="text-sm font-medium text-gray-700 mb-4">
            {t("createNew")} {t("sizeConfiguration")}
          </h3>

          <div className="max-w-sm mx-auto space-y-3">
            <input
              type="text"
              value={newConfigName}
              onChange={(e) => setNewConfigName(e.target.value)}
              placeholder={
                currentLanguage === "np"
                  ? "कन्फिगरेसन नाम"
                  : "Configuration Name"
              }
              className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
            {errors.newConfig && (
              <p className="text-sm text-red-600">{errors.newConfig}</p>
            )}
            <button
              onClick={handleCreateCustomConfig}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              {t("create")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  const ArticleMappings = () => (
    <div className="space-y-4">
      {/* Add New Article */}
      <div className="bg-blue-50 rounded-lg border border-blue-200 p-4">
        <h3 className="font-medium text-blue-800 mb-3">
          {t("addNew")} {t("article")}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            type="text"
            value={newArticle.number}
            onChange={(e) =>
              setNewArticle((prev) => ({ ...prev, number: e.target.value }))
            }
            placeholder={
              currentLanguage === "np" ? "लेख नम्बर" : "Article Number"
            }
            className="p-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <input
            type="text"
            value={newArticle.name}
            onChange={(e) =>
              setNewArticle((prev) => ({ ...prev, name: e.target.value }))
            }
            placeholder={currentLanguage === "np" ? "लेख नाम" : "Article Name"}
            className="p-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          />
          <select
            value={newArticle.sizeConfig}
            onChange={(e) =>
              setNewArticle((prev) => ({ ...prev, sizeConfig: e.target.value }))
            }
            className="p-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
          >
            {Object.entries(configurations).map(([configId, config]) => (
              <option key={configId} value={configId}>
                {currentLanguage === "np" ? config.nameNepali : config.name}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddArticle}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 inline mr-1" />
            {t("add")}
          </button>
        </div>

        {errors.newArticle && (
          <p className="mt-2 text-sm text-red-600">{errors.newArticle}</p>
        )}
      </div>

      {/* Articles List */}
      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                {t("article")} #{t("name")}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                {t("currentSizeConfig")}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                {t("availableSizes")}
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                {t("actions")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {articles.map((article) => (
              <tr key={article.number} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <div>
                    <div className="font-medium text-gray-800">
                      {article.number}# {article.name}
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={article.currentConfig}
                    onChange={(e) =>
                      handleUpdateArticleMapping(article.number, e.target.value)
                    }
                    className="w-full p-2 border border-gray-300 rounded text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                  >
                    {Object.entries(configurations).map(
                      ([configId, config]) => (
                        <option key={configId} value={configId}>
                          {currentLanguage === "np"
                            ? config.nameNepali
                            : config.name}
                        </option>
                      )
                    )}
                  </select>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {configurations[article.currentConfig]?.sizes.map(
                      (size, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded"
                        >
                          {size}
                        </span>
                      )
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <button
                    onClick={() => handleDeleteArticle(article.number)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const EditConfigurationForm = ({ config, onSave, onCancel, error }) => {
    const [editData, setEditData] = useState({
      name: config.name,
      nameNepali: config.nameNepali,
      sizes: [...config.sizes],
    });

    const handleAddSize = () => {
      setEditData((prev) => ({
        ...prev,
        sizes: [...prev.sizes, ""],
      }));
    };

    const handleSizeChange = (index, value) => {
      setEditData((prev) => ({
        ...prev,
        sizes: prev.sizes.map((size, i) => (i === index ? value : size)),
      }));
    };

    const handleRemoveSize = (index) => {
      setEditData((prev) => ({
        ...prev,
        sizes: prev.sizes.filter((_, i) => i !== index),
      }));
    };

    return (
      <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("englishName")}
            </label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, name: e.target.value }))
              }
              className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t("nepaliName")}
            </label>
            <input
              type="text"
              value={editData.nameNepali}
              onChange={(e) =>
                setEditData((prev) => ({ ...prev, nameNepali: e.target.value }))
              }
              className="w-full p-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t("sizes")} ({editData.sizes.length})
          </label>
          <div className="space-y-2">
            {editData.sizes.map((size, index) => (
              <div key={index} className="flex space-x-2">
                <input
                  type="text"
                  value={size}
                  onChange={(e) => handleSizeChange(index, e.target.value)}
                  placeholder={`${t("size")} ${index + 1}`}
                  className="flex-1 p-2 border border-gray-300 rounded focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                />
                <button
                  onClick={() => handleRemoveSize(index)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            <button
              onClick={handleAddSize}
              className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded hover:border-blue-400 hover:text-blue-600 transition-colors"
            >
              <Plus className="w-4 h-4 inline mr-2" />
              {t("addSize")}
            </button>
          </div>
          {error && (
            <p className="mt-2 text-sm text-red-600 flex items-center">
              <AlertTriangle className="w-4 h-4 mr-1" />
              {error}
            </p>
          )}
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => onSave(editData)}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
          >
            <Save className="w-4 h-4 mr-2" />
            {t("save")}
          </button>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors flex items-center"
          >
            <X className="w-4 h-4 mr-2" />
            {t("cancel")}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[95vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-800 flex items-center">
            <Settings className="w-6 h-6 mr-2 text-blue-600" />
            {t("sizeConfiguration")} {t("management")}
          </h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={exportConfiguration}
              className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center text-sm"
            >
              <Download className="w-4 h-4 mr-1" />
              {t("export")}
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-6 px-6 pt-4 border-b border-gray-200">
          <button
            onClick={() => setActiveTab("mappings")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "mappings"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            📦 {t("article")} {t("mappings")}
          </button>
          <button
            onClick={() => setActiveTab("configurations")}
            className={`pb-3 px-1 border-b-2 font-medium text-sm transition-colors ${
              activeTab === "configurations"
                ? "border-blue-500 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            ⚙️ {t("size")} {t("configurations")}
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(95vh-200px)]">
          {activeTab === "mappings" && <ArticleMappings />}
          {activeTab === "configurations" && <ConfigurationsList />}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
          <div className="text-sm text-gray-600">
            {articles.length} {t("articles")} |{" "}
            {Object.keys(configurations).length} {t("configurations")}
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
            >
              {t("cancel")}
            </button>
            <button
              onClick={() =>
                onSave({ configurations, articleMappings, articles })
              }
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors flex items-center"
            >
              <Check className="w-4 h-4 mr-2" />
              {t("saveChanges")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeConfiguration;
