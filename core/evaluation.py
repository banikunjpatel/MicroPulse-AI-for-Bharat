import numpy as np

def mean_absolute_error(actual, predicted):
    return np.mean(np.abs(np.array(actual) - np.array(predicted)))
