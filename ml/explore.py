"""Step 3: fit Logistic Regression and compare to the majority-class baseline."""
import pandas as pd
import os
from sklearn.model_selection import train_test_split
from sklearn.linear_model import LogisticRegression
from sklearn.tree import DecisionTreeClassifier, export_text
from sklearn.metrics import accuracy_score
from sklearn.preprocessing import StandardScaler

CSV_PATH = os.path.join(os.path.dirname(__file__), "data", "pokemon_stats.csv")

df = pd.read_csv(CSV_PATH)

print(df.shape)
print(df.head())
print()

counts = df["primary_type"].value_counts()
print(counts)

majority_class = counts.idxmax()
baseline_accuracy = counts.max() / len(df)
print(f"\nMajority-class baseline: predict '{majority_class}' always -> {baseline_accuracy:.1%} accuracy")

STAT_COLUMNS = ["hp", "attack", "defense", "special-attack", "special-defense", "speed"]
X = df[STAT_COLUMNS]
y = df["primary_type"]

X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=y
)

print(f"\ntrain: {X_train.shape}, test: {X_test.shape}")
print("\ntrain class counts:")
print(y_train.value_counts())
print("\ntest class counts:")
print(y_test.value_counts())

scaler = StandardScaler()
X_train_scaled = scaler.fit_transform(X_train)
X_test_scaled = scaler.transform(X_test)

model = LogisticRegression(max_iter=1000)
model.fit(X_train_scaled, y_train)

y_pred = model.predict(X_test_scaled)
lr_accuracy = accuracy_score(y_test, y_pred)

print(f"\nLogistic Regression accuracy: {lr_accuracy:.1%}")
print(f"Majority-class baseline:      {baseline_accuracy:.1%}")

# Look at softmax's actual output for a few test rows
probs = model.predict_proba(X_test_scaled)
for i in range(3):
    row_index = X_test.index[i]
    name = df.loc[row_index, "name"]
    true_type = y_test.iloc[i]
    pred_type = y_pred[i]

    type_probs = pd.Series(probs[i], index=model.classes_).sort_values(ascending=False)

    print(f"\n{name} (true: {true_type}, predicted: {pred_type})")
    print(type_probs.head(5).apply(lambda p: f"{p:.1%}"))
    print(f"sum of all probabilities: {probs[i].sum():.4f}")

# Decision Tree — trees split on raw thresholds (e.g. "speed > 90?"), so scaling
# doesn't change anything about the splits. We use the unscaled X_train/X_test.
tree = DecisionTreeClassifier(random_state=42)
tree.fit(X_train, y_train)

train_accuracy = accuracy_score(y_train, tree.predict(X_train))
test_accuracy = accuracy_score(y_test, tree.predict(X_test))

print(f"\nDecision Tree train accuracy: {train_accuracy:.1%}")
print(f"Decision Tree test accuracy:  {test_accuracy:.1%}")
print(f"(Logistic Regression test accuracy was {lr_accuracy:.1%}, baseline {baseline_accuracy:.1%})")

print("\nfeature importances (which stats the tree actually split on):")
importances = pd.Series(tree.feature_importances_, index=STAT_COLUMNS).sort_values(ascending=False)
print(importances.apply(lambda v: f"{v:.1%}"))

print("\nfirst few levels of the actual learned rules:")
print(export_text(tree, feature_names=STAT_COLUMNS, max_depth=3))
